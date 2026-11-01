import type { Metadata } from "next";
import { HeartHandshake, ShieldCheck, Users, Wallet } from "lucide-react";
import type { CountryCode, Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { donationTotals, getSettings, listCommittee } from "@/lib/repo";
import { getCurrentMember } from "@/lib/auth";
import { stripeEnabled } from "@/lib/stripe";
import { DonateForm } from "@/components/site/donate-form";
import { formatMoney } from "@/lib/format";
import { stateName } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Community fund",
  description:
    "Support your state's Libyan community fund. Contributions are capped at $10 per family each month and reported publicly to members.",
};

export default async function DonatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const [settings, member, totals] = await Promise.all([getSettings(), getCurrentMember(), donationTotals()]);
  const country: CountryCode =
    (typeof query.country === "string" ? (query.country as CountryCode) : member?.country) ?? "US";
  const stateCode = (typeof query.state === "string" ? query.state : member?.stateCode) ?? "";
  const committee = member && stateCode ? await listCommittee(stateCode) : [];
  const stateTotal = stateCode ? (totals.byState[stateCode] ?? 0) : 0;
  const name = [member?.firstName, member?.lastName].filter(Boolean).join(" ");

  return (
    <>
      <section className="section-tight" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="eyebrow">{t("nav.donations")}</div>
          <h1 className="section-title" style={{ fontSize: "clamp(30px,4vw,46px)", maxWidth: "20ch" }}>
            {t("donate.title")}
          </h1>
          <p className="section-sub">{t("donate.subtitle")}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "start", gap: 32 }}>
            <div className="member-card">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 18 }}>
                  {error === "amount"
                    ? t("members.donationCapped", { cap: settings.monthlyCapCents / 100 })
                    : error === "limit"
                      ? locale === "ar"
                        ? `بلغت حد المساهمة الشهرية لعائلتك. المتبقي هذا الشهر: ${(Number(query.remaining ?? 0) / 100).toFixed(2)} دولار.`
                        : `Your family has reached this month's contribution cap. Remaining this month: $${(Number(query.remaining ?? 0) / 100).toFixed(2)}.`
                      : error === "stripe"
                      ? locale === "ar"
                        ? "تعذر بدء الدفع. حاول لاحقاً."
                        : "We could not start the payment. Please try again."
                      : locale === "ar"
                        ? "أكمل جميع الحقول المطلوبة."
                        : "Please complete all required fields."}
                </div>
              )}
              <DonateForm
                locale={locale}
                defaultCountry={country}
                defaultState={stateCode}
                defaultCity=""
                capCents={settings.monthlyCapCents}
                memberName={name ?? ""}
                memberEmail={member?.email ?? ""}
                demo={!stripeEnabled()}
              />
            </div>

            <aside className="stack" style={{ gap: 16 }}>
              <div className="member-card" style={{ background: "var(--ink)", color: "#fff", border: 0 }}>
                <div className="row" style={{ gap: 8, color: "#e8c98f" }}>
                  <Wallet size={18} />
                  <span className="tiny" style={{ letterSpacing: ".12em", textTransform: "uppercase" }}>
                    {stateCode ? stateName(country, stateCode, locale) : t("nav.donations")}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 38, marginTop: 10, letterSpacing: "-.02em" }}>
                  {formatMoney(stateTotal, locale)}
                </div>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: 13.5, marginTop: 6 }}>
                  {locale === "ar" ? "المُحصَّل في هذا الصندوق" : "Collected in this fund"}
                </p>
              </div>

              <div className="member-card">
                <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                  <ShieldCheck size={17} style={{ color: "var(--accent)" }} />
                  <h2 style={{ fontSize: 15 }}>{t("members.reportsTitle")}</h2>
                </div>
                <p className="small muted" style={{ lineHeight: 1.7 }}>
                  {locale === "ar"
                    ? "كل مساهمة تُسجل باسمها وتاريخها، وكل مصروف يُنشر في تقرير يصل إلى صندوق بريد كل عضو في الولاية."
                    : "Every contribution is recorded with a name and date. Every expense is published in a report delivered to each member's inbox in that state."}
                </p>
                {committee.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                    <div className="tiny muted" style={{ marginBottom: 8 }}>
                      {t("members.committeeTitle")}
                    </div>
                    {committee.map((person) => (
                      <div key={person.id} className="row" style={{ gap: 8, marginBottom: 6 }}>
                        <Users size={13} style={{ color: "var(--steel-soft)" }} />
                        <span style={{ fontSize: 12.5 }}>
                          {person.name} — {locale === "ar" ? person.roleAr : person.roleEn}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="alert alert-info">
                <HeartHandshake size={15} style={{ display: "inline", marginInlineEnd: 6 }} />
                {t("donate.secure")}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
