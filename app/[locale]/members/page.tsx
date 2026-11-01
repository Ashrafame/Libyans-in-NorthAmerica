import Link from "next/link";
import { ArrowRight, Inbox, Lightbulb, Users, Wallet } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import {
  donationTotals,
  listAllComments,
  listChildren,
  listCommittee,
  listFundReports,
  listInbox,
  listMembers,
  listProposals,
} from "@/lib/repo";
import { stateName } from "@/lib/geo";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

export default async function MemberOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const member = await requireMember();
  const [children, inbox, proposals, comments, members, reports, committee, totals] = await Promise.all([
    listChildren(member.id),
    listInbox(member.id),
    listProposals(),
    listAllComments(),
    listMembers({ status: "active" }),
    listFundReports(member.stateCode ?? undefined),
    listCommittee(member.stateCode ?? undefined),
    donationTotals(),
  ]);

  const name = member.firstName ?? member.email;
  const stateFamilies = members.filter((m) => m.country === member.country && m.stateCode === member.stateCode).length;
  const unread = inbox.filter((message) => !message.readAt).length;
  const fundTotal = member.stateCode ? (totals.byState[member.stateCode] ?? 0) : 0;
  const latestReport = reports[0];

  const metrics = [
    { icon: <Users size={17} />, label: t("members.familyMembers"), value: formatNumber(member.householdSize ?? 1, locale), href: `/${locale}/members/profile` },
    { icon: <Users size={17} />, label: t("members.stateFamilies"), value: formatNumber(stateFamilies, locale), href: `/${locale}/members/directory` },
    { icon: <Inbox size={17} />, label: t("members.unread"), value: formatNumber(unread, locale), href: `/${locale}/members/inbox` },
    { icon: <Wallet size={17} />, label: t("members.fundBalance"), value: formatMoney(fundTotal, locale), href: `/${locale}/members/donations` },
  ];

  return (
    <>
      <div className="member-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {stateName(member.country, member.stateCode, locale)} · {member.city}
          </div>
          <h1>{t("members.welcome", { name })}</h1>
          <p className="section-sub">{t("members.overviewSub")}</p>
        </div>
        <span className="tag tag-success">
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />
          {t("members.profileComplete")}
        </span>
      </div>

      <div className="grid-4" style={{ gap: 16, marginBottom: 22 }}>
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="member-card" style={{ padding: 20 }}>
            <div className="row" style={{ gap: 8, color: "var(--accent)" }}>
              {metric.icon}
              <span className="tiny" style={{ letterSpacing: ".08em", textTransform: "uppercase", color: "var(--steel-soft)" }}>
                {metric.label}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, marginTop: 10, letterSpacing: "-.02em" }}>
              {metric.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="member-card">
          <div className="spread" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18 }}>{t("members.proposalsTitle")}</h2>
            <Link href={`/${locale}/members/proposals`} className="link-arrow" style={{ fontSize: 13 }}>
              {t("home.viewAll")}
              <ArrowRight size={14} />
            </Link>
          </div>
          {proposals.length === 0 ? (
            <p className="small muted">{t("members.proposalEmpty")}</p>
          ) : (
            <div className="stack" style={{ gap: 0 }}>
              {proposals.slice(0, 4).map((proposal) => {
                const count = comments.filter((comment) => comment.proposalId === proposal.id).length;
                return (
                  <Link
                    key={proposal.id}
                    href={`/${locale}/members/proposals/${proposal.id}`}
                    style={{ paddingBlock: 12, borderBottom: "1px solid var(--line)" }}
                  >
                    <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                      <Lightbulb size={15} style={{ color: "var(--sand)", marginTop: 4, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{proposal.title}</div>
                        <div className="tiny muted" style={{ marginTop: 4 }}>
                          {proposal.authorName} · {t("members.comments", { count })}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="member-card">
          <div className="spread" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18 }}>{t("members.donationsTitle")}</h2>
            <Link href={`/${locale}/members/donations`} className="link-arrow" style={{ fontSize: 13 }}>
              {t("common.view")}
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ background: "var(--muted)", borderRadius: "var(--radius-card)", padding: 16, marginBottom: 16 }}>
            <div className="tiny muted">{t("members.fundFor", { state: stateName(member.country, member.stateCode, locale) })}</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, marginTop: 4 }}>{formatMoney(fundTotal, locale)}</div>
          </div>

          {latestReport ? (
            <div>
              <div className="tiny muted" style={{ letterSpacing: ".06em", textTransform: "uppercase" }}>
                {t("members.reportsTitle")}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>
                {locale === "ar" ? latestReport.titleAr : latestReport.titleEn}
              </div>
              <div className="tiny muted" style={{ marginTop: 3 }}>
                {latestReport.periodLabel} · {formatDate(latestReport.publishedAt, locale)}
              </div>
            </div>
          ) : (
            <p className="small muted">{t("members.reportsEmpty")}</p>
          )}

          {committee.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div className="tiny muted">{t("members.committeeTitle")}</div>
              <div className="tiny" style={{ marginTop: 5 }}>
                {committee.map((person) => person.name).join(" · ")}
              </div>
            </div>
          )}
        </section>
      </div>

      {children.length > 0 && (
        <section className="member-card" style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t("join.childrenTitle")}</h2>
          {children.map((child) => (
            <div key={child.id} className="person-row">
              <span className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                {child.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="person-name">{child.name}</div>
                <div className="person-meta">
                  {formatDate(child.birthDate, locale)} · {child.education ?? "—"}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
