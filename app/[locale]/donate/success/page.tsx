import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import type { CountryCode, Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { stateName } from "@/lib/geo";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Thank you" };

export default async function DonateSuccessPage({
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
  const stateCode = typeof query.state === "string" ? query.state : "";
  const country = (typeof query.country === "string" ? query.country : "US") as CountryCode;
  const amount = Number(query.amount ?? 0);

  return (
    <section className="section" style={{ minHeight: "60vh" }}>
      <div className="container-narrow">
        <div className="wizard-card center" style={{ paddingBlock: 48 }}>
          <div
            className="pillar-icon"
            style={{ margin: "0 auto 18px", width: 54, height: 54, borderRadius: 99, background: "#eaf5ef", color: "var(--success)" }}
          >
            <Check size={26} />
          </div>
          <h1 style={{ fontSize: 32 }}>{t("donate.successTitle")}</h1>
          <p className="section-sub" style={{ marginInline: "auto" }}>
            {t("donate.successBody", { state: stateCode ? stateName(country, stateCode, locale) : "" })}
          </p>
          {amount > 0 && (
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, marginTop: 18 }}>
              {formatMoney(amount, locale)}
            </div>
          )}
          {query.demo && (
            <div className="alert alert-warn" style={{ marginTop: 20, textAlign: "start" }}>
              {t("donate.demoNote")}
            </div>
          )}
          <Link href={`/${locale}`} className="btn btn-secondary" style={{ marginTop: 26 }}>
            {t("donate.back")}
          </Link>
        </div>
      </div>
    </section>
  );
}
