import Link from "next/link";
import { Mail, Phone, UserRound } from "lucide-react";
import type { Locale, Member, SiteSettings } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { Brand } from "./brand";
import { NavLink } from "./nav-link";
import { LocaleSwitcher } from "./locale-switcher";
import { memberSignOutAction } from "@/lib/actions/auth";
import { SocialIcons } from "./social-icons";

export function SiteHeader({
  locale,
  settings,
  member,
}: {
  locale: Locale;
  settings: SiteSettings;
  member: Member | null;
}) {
  const t = createTranslator(locale);
  const nav = [
    { href: `/${locale}`, label: t("nav.home"), exact: true },
    { href: `/${locale}/news`, label: t("nav.news") },
    { href: `/${locale}/events`, label: t("nav.events") },
    { href: `/${locale}/about`, label: t("nav.about") },
  ];

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container">
          <div className="row" style={{ gap: 18 }}>
            <a href={`mailto:${settings.contactEmail}`} className="row" style={{ gap: 6 }}>
              <Mail size={13} aria-hidden="true" />
              <span>{settings.contactEmail}</span>
            </a>
            {settings.phones[0] && (
              <span className="row" style={{ gap: 6 }}>
                <Phone size={13} aria-hidden="true" />
                <span dir="ltr">{settings.phones[0]}</span>
              </span>
            )}
          </div>
          <div className="topbar-social">
            <SocialIcons settings={settings} size={14} />
          </div>
        </div>
      </div>

      <div className="container header-inner">
        <Brand locale={locale} settings={settings} />

        <nav className="nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.exact}>
              {item.label}
            </NavLink>
          ))}
          {member && (
            <>
              <NavLink href={`/${locale}/members/directory`}>{t("nav.directory")}</NavLink>
              <NavLink href={`/${locale}/members/proposals`}>{t("nav.proposals")}</NavLink>
            </>
          )}
        </nav>

        <div className="header-actions">
          <LocaleSwitcher locale={locale} label={t("nav.language")} />

          {member ? (
            <>
              <Link href={`/${locale}/members`} className="btn btn-secondary btn-sm btn-desktop">
                <UserRound size={15} aria-hidden="true" />
                {t("nav.dashboard")}
              </Link>
              <form action={memberSignOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="btn btn-ghost btn-sm">
                  {t("nav.logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`} className="btn btn-ghost btn-sm">
                {t("nav.login")}
              </Link>
              <Link href={`/${locale}/join`} className="btn btn-primary btn-sm btn-desktop">
                {t("nav.join")}
              </Link>
            </>
          )}

          <details className="mobile-nav">
            <summary className="mobile-toggle" aria-label={t("nav.menu")}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                <path d="M0 1h18M0 7h18M0 13h12" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </summary>
            <div className="mobile-panel">
              <div className="container">
                {nav.map((item) => (
                  <NavLink key={item.href} href={item.href} exact={item.exact}>
                    {item.label}
                  </NavLink>
                ))}
                {member ? (
                  <>
                    <NavLink href={`/${locale}/members`}>{t("nav.dashboard")}</NavLink>
                    <NavLink href={`/${locale}/members/directory`}>{t("nav.directory")}</NavLink>
                    <NavLink href={`/${locale}/members/proposals`}>{t("nav.proposals")}</NavLink>
                    <NavLink href={`/${locale}/members/donations`}>{t("nav.donations")}</NavLink>
                    <NavLink href={`/${locale}/members/inbox`}>{t("nav.inbox")}</NavLink>
                    <form action={memberSignOutAction} style={{ padding: "10px 12px" }}>
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className="btn btn-secondary btn-sm btn-block">
                        {t("nav.logout")}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ padding: "12px 6px", display: "flex", gap: 8 }}>
                    <Link href={`/${locale}/login`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                      {t("nav.login")}
                    </Link>
                    <Link href={`/${locale}/join`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      {t("nav.join")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
      <p className="sr-only">{pickText(locale, settings.taglineEn, settings.taglineAr)}</p>
    </header>
  );
}
