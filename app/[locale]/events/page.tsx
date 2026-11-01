import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { listEvents, getSettings } from "@/lib/repo";
import { formatDate, daysLeft } from "@/lib/format";
import { NoticeTicker } from "@/components/site/notice-ticker";

export const metadata: Metadata = {
  title: "Community events",
  description: "Eid gatherings, graduations, condolences, conferences, and community nights across the US and Canada.",
};

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const [events, settings] = await Promise.all([listEvents(), getSettings()]);
  const now = Date.now();

  const upcoming = events.filter((event) => new Date(event.announceUntil).getTime() > now);
  const past = events.filter((event) => new Date(event.announceUntil).getTime() <= now);
  const tickers = settings.tickerEnabled
    ? events
        .filter((event) => event.tickerEnabled && new Date(event.tickerUntil).getTime() > now)
        .map((event) => ({
          id: event.id,
          textEn: event.tickerTextEn,
          textAr: event.tickerTextAr,
          bg: event.tickerBgColor,
          color: event.tickerTextColor,
        }))
    : [];

  return (
    <>
      <NoticeTicker items={tickers} locale={locale} label={t("events.ticker")} />

      <section className="section-tight" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="eyebrow">{t("nav.events")}</div>
          <h1 className="section-title" style={{ fontSize: "clamp(30px,4vw,46px)" }}>
            {t("events.title")}
          </h1>
          <p className="section-sub">{t("events.subtitle")}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <h2 style={{ fontSize: 22, marginBottom: 20 }}>{t("events.upcoming")}</h2>

          {upcoming.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={22} style={{ marginBottom: 8 }} />
              <div>{t("events.none")}</div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 18 }}>
              {upcoming.map((event) => (
                <article key={event.id} className="spotlight">
                  <div className="spotlight-media" style={{ minHeight: 280 }}>
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" />
                    ) : (
                      <div className="media-fallback" style={{ background: "linear-gradient(135deg,#2b2f33,#4a4f54)" }}>
                        <span>{t("events.displayUntil", { date: formatDate(event.announceUntil, locale) })}</span>
                        <strong>{pickText(locale, event.titleEn, event.titleAr)}</strong>
                      </div>
                    )}
                  </div>
                  <div className="spotlight-body">
                    <div className="row" style={{ gap: 8 }}>
                      <span className="tag tag-accent">
                        <CalendarDays size={13} aria-hidden="true" />
                        {t("events.displayUntil", { date: formatDate(event.announceUntil, locale) })}
                      </span>
                      <span className="tag tag-sand">
                        {locale === "ar"
                          ? `باقٍ ${daysLeft(event.announceUntil)} يوماً`
                          : `${daysLeft(event.announceUntil)} days left`}
                      </span>
                    </div>
                    <h3 className="spotlight-title">{pickText(locale, event.titleEn, event.titleAr)}</h3>
                    <p className="muted" style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {pickText(locale, event.bodyEn, event.bodyAr)}
                    </p>
                    <Link href={`/${locale}/join`} className="link-arrow" style={{ marginTop: 6 }}>
                      {t("nav.join")}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <hr className="rule" style={{ marginBlock: 44 }} />
              <h2 style={{ fontSize: 20, marginBottom: 18 }}>{t("events.past")}</h2>
              <div className="grid-3">
                {past.slice(0, 6).map((event) => (
                  <div key={event.id} className="card card-pad">
                    <div className="post-kicker">{formatDate(event.announceUntil, locale)}</div>
                    <h3 className="post-title" style={{ marginTop: 8 }}>
                      {pickText(locale, event.titleEn, event.titleAr)}
                    </h3>
                    <p className="post-excerpt" style={{ marginTop: 8 }}>
                      {pickText(locale, event.bodyEn, event.bodyAr)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
