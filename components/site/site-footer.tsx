import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Locale, SiteSettings } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { Brand } from "./brand";
import { SocialIcons } from "./social-icons";

export function SiteFooter({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const t = createTranslator(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand locale={locale} settings={settings} />
            <p className="small muted" style={{ marginTop: 16, maxWidth: "34ch", lineHeight: 1.7 }}>
              {pickText(locale, settings.footerAboutEn, settings.footerAboutAr)}
            </p>
            <div style={{ marginTop: 20 }}>
              <SocialIcons settings={settings} size={15} />
            </div>
          </div>

          <div>
            <div className="footer-title">{t("footer.explore")}</div>
            <div className="footer-links">
              <Link href={`/${locale}/news`}>{t("nav.news")}</Link>
              <Link href={`/${locale}/events`}>{t("nav.events")}</Link>
              <Link href={`/${locale}/about`}>{t("nav.about")}</Link>
              <Link href={`/${locale}/donate`}>{t("donate.title")}</Link>
            </div>
          </div>

          <div>
            <div className="footer-title">{t("footer.community")}</div>
            <div className="footer-links">
              <Link href={`/${locale}/join`}>{t("nav.join")}</Link>
              <Link href={`/${locale}/login`}>{t("footer.membersOnly")}</Link>
              <Link href={`/${locale}/members/proposals`}>{t("nav.proposals")}</Link>
              <Link href={`/${locale}/members/inbox`}>{t("nav.inbox")}</Link>
            </div>
          </div>

          <div>
            <div className="footer-title">{t("footer.contact")}</div>
            <div className="footer-links">
              <a href={`mailto:${settings.contactEmail}`} className="row" style={{ gap: 8 }}>
                <Mail size={14} aria-hidden="true" />
                <span dir="ltr">{settings.contactEmail}</span>
              </a>
              {settings.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="row" style={{ gap: 8 }}>
                  <Phone size={14} aria-hidden="true" />
                  <span dir="ltr">{phone}</span>
                </a>
              ))}
              <span className="row" style={{ gap: 8 }}>
                <MapPin size={14} aria-hidden="true" />
                <span>{locale === "ar" ? "الولايات المتحدة وكندا" : "United States & Canada"}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} {pickText(locale, settings.titleEn, settings.titleAr)} — {t("footer.rights")}
          </span>
          <span className="row" style={{ gap: 16 }}>
            <span>{t("footer.built")}</span>
            <Link href="/admin" style={{ opacity: 0.75 }}>
              {t("login.adminLink")}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
