import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { communityStats, getSettings, listEvents, listPosts } from "@/lib/repo";
import { formatDate, formatMoney, formatNumber, readingMinutes } from "@/lib/format";
import { PostCard } from "@/components/site/post-card";
import { EventCard } from "@/components/site/event-card";
import { NoticeTicker } from "@/components/site/notice-ticker";
import { CollapsibleHeroCard } from "@/components/site/collapsible-hero-card";

export const metadata: Metadata = {
  description:
    "Connecting Libyan families across the United States and Canada — community news, events, skills, and state funds.",
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const [settings, posts, events, stats] = await Promise.all([
    getSettings(),
    listPosts({ limit: 10 }),
    listEvents(),
    communityStats(),
  ]);

  const now = Date.now();
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const leadPosts = posts.filter((post) => post.id !== featured?.id).slice(0, 4);
  const remaining = posts.filter((post) => post.id !== featured?.id).slice(0, 3);

  const activeAnnouncements = events.filter((event) => new Date(event.announceUntil).getTime() > now);
  const activeTickers = settings.tickerEnabled
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

  const qualifications =
    locale === "ar"
      ? [
          "الطب والجراحة",
          "الهندسة والطاقة",
          "الأكاديميا والبحث",
          "اللوجستيات والتجارة",
          "الأعمال الصغيرة",
          "المهن الحرفية",
          "الخدمة العامة",
          "طلاب وخريجون",
        ]
      : [
          "Medicine & surgery",
          "Engineering & energy",
          "Academia & research",
          "Logistics & trade",
          "Small business",
          "Skilled trades",
          "Public service",
          "Students & graduates",
        ];

  const pillars = [
    { icon: <Users size={20} />, title: t("home.pillar1Title"), body: t("home.pillar1Body") },
    { icon: <Sparkles size={20} />, title: t("home.pillar2Title"), body: t("home.pillar2Body") },
    { icon: <HeartHandshake size={20} />, title: t("home.pillar3Title"), body: t("home.pillar3Body") },
    { icon: <Lightbulb size={20} />, title: t("home.pillar4Title"), body: t("home.pillar4Body") },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-media">
          <Image
            src={settings.heroImage}
            alt={
              locale === "ar"
                ? "مشهد يجمع معالم ليبيا وجسر بروكلين ومدينة نيويورك وعائلات ليبية"
                : "A scene joining Libyan landmarks, the Brooklyn Bridge, New York, and Libyan families"
            }
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="container hero-inner">
          <CollapsibleHeroCard collapseLabel={t("home.hideCard")} expandLabel={t("home.showCard")}>
            <span className="hero-badge">{pickText(locale, settings.heroBadgeEn, settings.heroBadgeAr)}</span>
            <h1 className="hero-title">{pickText(locale, settings.heroTitleEn, settings.heroTitleAr)}</h1>
            <p className="hero-sub">{pickText(locale, settings.heroSubtitleEn, settings.heroSubtitleAr)}</p>
            <div className="hero-actions">
              <Link href={`/${locale}/join`} className="btn btn-primary btn-lg">
                {pickText(locale, settings.membershipCtaEn, settings.membershipCtaAr)}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href={`/${locale}/news`} className="btn btn-secondary btn-lg">
                {t("home.heroSecondary")}
              </Link>
            </div>
            <div className="hero-meta">
              <div>
                <strong>{formatNumber(stats.members, locale)}+</strong>
                <span>{t("home.statsFamilies")}</span>
              </div>
              <div>
                <strong>{formatNumber(stats.states, locale)}</strong>
                <span>{t("home.statsStates")}</span>
              </div>
              <div>
                <strong>{formatNumber(stats.events, locale)}</strong>
                <span>{t("home.statsEvents")}</span>
              </div>
            </div>
          </CollapsibleHeroCard>
        </div>
      </section>

      <NoticeTicker items={activeTickers} locale={locale} label={t("events.ticker")} />

      <section className="stats-band">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-value">{formatNumber(stats.families, locale)}</div>
              <div className="stat-label">{t("home.statsFamilies")}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{formatNumber(stats.states, locale)}</div>
              <div className="stat-label">{t("home.statsStates")}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{formatNumber(stats.events, locale)}</div>
              <div className="stat-label">{t("home.statsEvents")}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{formatMoney(stats.donationsTotal, locale)}</div>
              <div className="stat-label">{t("home.statsFund")}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">{t("home.latestEyebrow")}</div>
              <h2 className="section-title">{t("home.latestTitle")}</h2>
              <p className="section-sub">{t("home.latestSub")}</p>
            </div>
            <Link href={`/${locale}/news`} className="link-arrow">
              {t("home.viewAll")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {featured && (
            <div className="home-lead">
              <Link href={`/${locale}/news/${featured.slug}`} className="spotlight">
                <div className="spotlight-media">
                  {featured.coverImage ? (
                    <img src={featured.coverImage} alt="" />
                  ) : (
                    <div className="media-fallback">
                      <span>{t(`news.kind.${featured.kind}` as "news.kind.news")}</span>
                      <strong>{pickText(locale, featured.titleEn, featured.titleAr)}</strong>
                    </div>
                  )}
                </div>
                <div className="spotlight-body">
                  <div className="row" style={{ gap: 8 }}>
                    <span className="tag tag-accent">{t(`news.kind.${featured.kind}` as "news.kind.news")}</span>
                    {featured.featured && <span className="tag tag-sand">{t("news.featured")}</span>}
                  </div>
                  <h3 className="spotlight-title">{pickText(locale, featured.titleEn, featured.titleAr)}</h3>
                  <p className="muted" style={{ fontSize: 15, lineHeight: 1.7 }}>
                    {pickText(locale, featured.excerptEn, featured.excerptAr)}
                  </p>
                  <div className="row" style={{ gap: 8, fontSize: 12.5, color: "var(--steel-soft)", marginTop: 6 }}>
                    <span>{formatDate(featured.publishedAt, locale)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {readingMinutes(pickText(locale, featured.bodyEn, featured.bodyAr))} {locale === "ar" ? "دقائق" : "min"}
                    </span>
                  </div>
                  <span className="link-arrow" style={{ marginTop: 8 }}>
                    {t("common.readMore")}
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>

              <div className="side-stories">
                {leadPosts.map((post) => (
                  <Link key={post.id} href={`/${locale}/news/${post.slug}`} className="side-story">
                    <time>{formatDate(post.publishedAt, locale)}</time>
                    <h4>{pickText(locale, post.titleEn, post.titleAr)}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid-3">
            {remaining.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">{t("home.eventsEyebrow")}</div>
              <h2 className="section-title">{t("home.eventsTitle")}</h2>
              <p className="section-sub">{t("home.eventsSub")}</p>
            </div>
            <Link href={`/${locale}/events`} className="link-arrow">
              {t("home.eventsAll")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {activeAnnouncements.length > 0 ? (
            <div className={activeAnnouncements.length === 2 ? "grid-2" : "grid-3"}>
              {activeAnnouncements.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CalendarDays size={22} style={{ marginBottom: 8 }} />
              <div>{t("events.none")}</div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">{t("home.storiesEyebrow")}</div>
              <h2 className="section-title">{t("home.storiesTitle")}</h2>
              <p className="section-sub">{t("home.storiesSub")}</p>
            </div>
          </div>

          <div className="split-band">
            <div>
              <h3 style={{ fontSize: 22 }}>{locale === "ar" ? "مؤهلات تحملها الجالية" : "Qualifications in our community"}</h3>
              <p className="muted small" style={{ marginTop: 10, marginBottom: 20 }}>
                {locale === "ar"
                  ? "مؤهلات أكاديمية ومهنية من ليبيا والولايات المتحدة وكندا، في كل ولاية ومقاطعة."
                  : "Academic and professional credentials from Libya, the United States, and Canada — in every state and province."}
              </p>
              <ul className="qualification-list">
                {qualifications.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: 22 }}>{locale === "ar" ? "كيف نبني المجتمع" : "How we build the community"}</h3>
              <p className="muted small" style={{ marginTop: 10, lineHeight: 1.75 }}>
                {locale === "ar"
                  ? "من دليل العائلات إلى صناديق الولايات، كل جزء من هذه المنصة يخدم هدفاً واحداً: أن يعرف الليبيون بعضهم، وأن يعرف العالم من نحن."
                  : "From the family directory to the state funds, every part of this platform serves one purpose: that Libyans know each other, and that the world knows who we are."}
              </p>
              <div className="pill-list" style={{ marginTop: 20 }}>
                <span className="tag tag-accent">
                  <BadgeCheck size={13} aria-hidden="true" />
                  {locale === "ar" ? "أعضاء موثّقون" : "Verified members"}
                </span>
                <span className="tag">{locale === "ar" ? "شفافية مالية" : "Open books"}</span>
                <span className="tag">{locale === "ar" ? "باللغتين" : "Bilingual"}</span>
                <span className="tag">{locale === "ar" ? "تطوع حقيقي" : "Real volunteering"}</span>
              </div>
              <Link href={`/${locale}/about`} className="link-arrow" style={{ marginTop: 24 }}>
                {t("nav.about")}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid-4" style={{ marginTop: 24 }}>
            {pillars.map((pillar) => (
              <div key={pillar.title} className="pillar">
                <div className="pillar-icon">{pillar.icon}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight" style={{ paddingBottom: 80 }}>
        <div className="container">
          <div className="cta-band">
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2>{t("home.ctaTitle")}</h2>
              <p>{t("home.ctaBody")}</p>
            </div>
            <div className="row" style={{ gap: 12, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
              <Link href={`/${locale}/join`} className="btn btn-white btn-lg">
                {t("home.ctaButton")}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/donate`}
                className="btn btn-lg"
                style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}
              >
                {t("donate.title")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
