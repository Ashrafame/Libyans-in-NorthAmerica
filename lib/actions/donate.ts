"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createDonation, createInboxMessage, getSettings, listDonations, updateDonation } from "@/lib/repo";
import { getCurrentMember } from "@/lib/auth";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { stateName } from "@/lib/geo";
import type { CountryCode, Locale } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function donateAction(form: FormData) {
  const locale = (form.get("locale") === "ar" ? "ar" : "en") as Locale;
  const country = str(form, "country") as CountryCode;
  const stateCode = str(form, "stateCode");
  const amountRaw = Number(str(form, "amount"));
  const donorName = str(form, "donorName");
  const donorEmail = str(form, "donorEmail");
  const note = str(form, "note");

  const settings = await getSettings();
  const capCents = settings.monthlyCapCents;
  const amountCents = Math.round(amountRaw * 100);

  if (!country || !stateCode || !donorName || !donorEmail) {
    redirect(`/${locale}/donate?error=missing`);
  }
  if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > capCents) {
    redirect(`/${locale}/donate?error=amount&state=${stateCode}&country=${country}`);
  }

  const member = await getCurrentMember();

  // Families contribute at most the monthly cap in total, not per transaction.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const existing = await listDonations({ status: "succeeded" });
  const usedThisMonth = existing
    .filter((row) => new Date(row.createdAt) >= monthStart)
    .filter((row) =>
      member ? row.memberId === member.id : row.donorEmail.toLowerCase() === donorEmail.toLowerCase(),
    )
    .reduce((sum, row) => sum + row.amountCents, 0);

  if (usedThisMonth + amountCents > capCents) {
    const remaining = Math.max(0, capCents - usedThisMonth);
    redirect(`/${locale}/donate?error=limit&remaining=${remaining}&state=${stateCode}&country=${country}`);
  }

  const donation = await createDonation({
    memberId: member?.id ?? null,
    donorName,
    donorEmail,
    country,
    stateCode,
    amountCents,
    note: note || null,
  });

  const stateLabel = stateName(country, stateCode, locale);
  const stateLabelEn = stateName(country, stateCode, "en");

  if (!stripeEnabled()) {
    await updateDonation(donation.id, { status: "succeeded" });
    if (member) {
      await createInboxMessage({
        memberId: member.id,
        kind: "system",
        subjectEn: "Contribution received",
        subjectAr: "تم استلام مساهمتك",
        bodyEn: `We recorded your contribution of $${(amountCents / 100).toFixed(2)} to the ${stateLabelEn} community fund. Thank you.`,
        bodyAr: `سجلنا مساهمتك بمبلغ ${(amountCents / 100).toFixed(2)} دولار في صندوق ${stateLabel} للجالية. شكراً لك.`,
      });
    }
    redirect(`/${locale}/donate/success?demo=1&state=${stateCode}&country=${country}&amount=${amountCents}`);
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: donorEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `${stateLabel} community fund`,
            description: "Monthly family contribution — Libyans in North America",
          },
        },
      },
    ],
    metadata: {
      donationId: donation.id,
      stateCode,
      country,
      locale,
    },
    success_url: `${origin}/${locale}/donate/success?session_id={CHECKOUT_SESSION_ID}&state=${stateCode}&country=${country}&amount=${amountCents}`,
    cancel_url: `${origin}/${locale}/donate?canceled=1&state=${stateCode}&country=${country}`,
  });

  await updateDonation(donation.id, { stripeSessionId: session.id });

  if (session.url) redirect(session.url);
  redirect(`/${locale}/donate?error=stripe`);
}

