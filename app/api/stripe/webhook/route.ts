import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  createInboxMessage,
  findDonationBySession,
  getDonationById,
  updateDonation,
} from "@/lib/repo";
import { stateName } from "@/lib/geo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: `Invalid signature: ${(error as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donationId;
    const donation = donationId ? await getDonationById(donationId) : await findDonationBySession(session.id);

    if (donation && donation.status !== "succeeded") {
      await updateDonation(donation.id, {
        status: "succeeded",
        stripeSessionId: session.id,
        amountCents: session.amount_total ?? donation.amountCents,
      });

      if (donation.memberId) {
        const stateEn = stateName(donation.country, donation.stateCode, "en");
        const stateAr = stateName(donation.country, donation.stateCode, "ar");
        await createInboxMessage({
          memberId: donation.memberId,
          kind: "system",
          subjectEn: "Contribution received",
          subjectAr: "تم استلام مساهمتك",
          bodyEn: `We recorded your contribution of $${(donation.amountCents / 100).toFixed(2)} to the ${stateEn} community fund. Thank you.`,
          bodyAr: `سجلنا مساهمتك بمبلغ ${(donation.amountCents / 100).toFixed(2)} دولار في صندوق ${stateAr} للجالية. شكراً لك.`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
