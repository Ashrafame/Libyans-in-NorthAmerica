import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Inbox, LayoutDashboard, Lightbulb, UserRound, Users, Wallet } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { getCurrentMember } from "@/lib/auth";
import { listInbox } from "@/lib/repo";
import { stateName } from "@/lib/geo";
import { SideLink } from "@/components/site/nav-link";
import { initials } from "@/lib/format";

export default async function MembersLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const member = await getCurrentMember();
  if (!member) redirect(`/${locale}/login?next=/${locale}/members`);
  if (member.status !== "active" || member.step !== "done") redirect(`/${locale}/join`);

  const inbox = await listInbox(member.id);
  const unread = inbox.filter((message) => !message.readAt).length;
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");

  const links = [
    { href: `/${locale}/members`, label: t("members.nav.overview"), icon: <LayoutDashboard size={16} />, exact: true },
    { href: `/${locale}/members/directory`, label: t("members.nav.directory"), icon: <Users size={16} /> },
    { href: `/${locale}/members/proposals`, label: t("members.nav.proposals"), icon: <Lightbulb size={16} /> },
    { href: `/${locale}/members/donations`, label: t("members.nav.donations"), icon: <Wallet size={16} /> },
    { href: `/${locale}/members/inbox`, label: t("members.nav.inbox"), icon: <Inbox size={16} /> },
    { href: `/${locale}/members/profile`, label: t("members.nav.profile"), icon: <UserRound size={16} /> },
  ];

  return (
    <div className="member-shell">
      <aside className="member-side">
        <div className="row" style={{ gap: 12 }}>
          <span className="avatar">{initials(name || member.email)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>{name || member.email}</div>
            <div className="tiny muted" style={{ marginTop: 3 }}>
              {member.city ? `${member.city}, ` : ""}
              {stateName(member.country, member.stateCode, locale)}
            </div>
          </div>
        </div>

        <nav className="side-nav" aria-label={t("nav.dashboard")}>
          {links.map((link) => (
            <SideLink key={link.href} href={link.href} icon={link.icon} exact={link.exact}>
              {link.label}
              {link.href.endsWith("/inbox") && unread > 0 && (
                <span className="tag tag-accent" style={{ marginInlineStart: "auto", padding: "1px 7px", fontSize: 10.5 }}>
                  {unread}
                </span>
              )}
            </SideLink>
          ))}
        </nav>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <Link href={`/${locale}/members/donations`} className="btn btn-secondary btn-sm btn-block">
            {t("members.contribute")}
          </Link>
          <Link href={`/${locale}`} className="tiny muted" style={{ display: "block", marginTop: 12, textAlign: "center" }}>
            {t("common.backHome")}
          </Link>
        </div>
      </aside>

      <div className="member-main">{children}</div>
    </div>
  );
}
