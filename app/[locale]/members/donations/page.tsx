import Link from "next/link";
import { ArrowRight, HeartHandshake, Receipt, Users } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import { donationTotals, getSettings, listCommittee, listDonations, listFundReports } from "@/lib/repo";
import { stateName } from "@/lib/geo";
import { formatDate, formatMoney } from "@/lib/format";

export default async function MemberDonationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const member = await requireMember();
  const [totals, reports, committee, settings, donations] = await Promise.all([
    donationTotals(),
    listFundReports(member.stateCode ?? undefined),
    listCommittee(member.stateCode ?? undefined),
    getSettings(),
    listDonations({ limit: 30 }),
  ]);

  const stateCode = member.stateCode ?? "";
  const stateLabel = stateName(member.country, stateCode, locale);
  const fundTotal = totals.byState[stateCode] ?? 0;
  const myDonations = donations.filter((donation) => donation.memberId === member.id);

  return (
    <>
      <div className="member-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("members.fundPublicNote")}</div>
          <h1>{t("members.donationsTitle")}</h1>
          <p className="section-sub">{t("members.donationsSub")}</p>
        </div>
        <Link href={`/${locale}/donate?state=${stateCode}`} className="btn btn-primary">
          <HeartHandshake size={16} />
          {t("members.contribute")}
        </Link>
      </div>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        <div className="member-card">
          <div className="tiny muted" style={{ letterSpacing: ".08em", textTransform: "uppercase" }}>
            {t("members.fundFor", { state: stateLabel })}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, marginTop: 8 }}>{formatMoney(fundTotal, locale)}</div>
          <div className="tiny muted" style={{ marginTop: 4 }}>{t("members.fundBalance")}</div>
        </div>
        <div className="member-card">
          <div className="tiny muted" style={{ letterSpacing: ".08em", textTransform: "uppercase" }}>
            {t("members.monthlyContribution")}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, marginTop: 8 }}>
            {formatMoney(settings.monthlyCapCents, locale)}
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>{t("common.perMonth")}</div>
        </div>
        <div className="member-card">
          <div className="tiny muted" style={{ letterSpacing: ".08em", textTransform: "uppercase" }}>
            {t("members.committeeTitle")}
          </div>
          {committee.length === 0 ? (
            <p className="tiny muted" style={{ marginTop: 10 }}>{t("members.committeeEmpty")}</p>
          ) : (
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {committee.map((person) => (
                <div key={person.id} className="row" style={{ gap: 8 }}>
                  <span className="avatar" style={{ width: 26, height: 26, fontSize: 9.5 }}>{person.name.slice(0, 1)}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{person.name}</div>
                    <div className="tiny muted">{locale === "ar" ? person.roleAr : person.roleEn}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="member-card">
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            <Receipt size={17} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 18 }}>{t("members.reportsTitle")}</h2>
          </div>
          {reports.length === 0 ? (
            <p className="small muted">{t("members.reportsEmpty")}</p>
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              {reports.map((report) => (
                <article key={report.id} style={{ paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                  <div className="spread">
                    <h3 style={{ fontSize: 15 }}>{locale === "ar" ? report.titleAr : report.titleEn}</h3>
                    <span className="tag">{report.periodLabel}</span>
                  </div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>
                    {formatDate(report.publishedAt, locale)} · {formatMoney(report.amountCents, locale)}
                  </div>
                  <p className="small" style={{ marginTop: 10, whiteSpace: "pre-line", color: "#2a343d", lineHeight: 1.7 }}>
                    {locale === "ar" ? report.bodyAr : report.bodyEn}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="member-card">
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            <Users size={17} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 18 }}>{locale === "ar" ? "مساهماتي" : "My contributions"}</h2>
          </div>
          {myDonations.length === 0 ? (
            <p className="small muted">
              {locale === "ar"
                ? "لم تسجل مساهمة بعد. المساهمة الشهرية للأسر محدودة بعشرة دولارات."
                : "No contribution recorded yet. The monthly family contribution is capped at ten dollars."}
            </p>
          ) : (
            <div>
              {myDonations.map((donation) => (
                <div key={donation.id} className="spread" style={{ paddingBlock: 10, borderBottom: "1px solid var(--line)" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{formatMoney(donation.amountCents, locale)}</div>
                    <div className="tiny muted">{formatDate(donation.createdAt, locale)}</div>
                  </div>
                  <span className={`tag ${donation.status === "succeeded" ? "tag-success" : ""}`}>{donation.status}</span>
                </div>
              ))}
            </div>
          )}

          <div className="alert alert-info" style={{ marginTop: 16 }}>{t("donate.secure")}</div>

          <Link href={`/${locale}/donate?state=${stateCode}`} className="btn btn-secondary btn-block" style={{ marginTop: 14 }}>
            {t("members.contribute")}
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </>
  );
}
