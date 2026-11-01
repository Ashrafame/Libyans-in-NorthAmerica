import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, HandHeart, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { communityStats, getSettings } from "@/lib/repo";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "About the community",
  description:
    "Who the Libyan diaspora in the United States and Canada are, where we live, what we do, and how this platform works.",
};

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const [stats, settings] = await Promise.all([communityStats(), getSettings()]);

  return (
    <>
      <section className="article-hero" style={{ minHeight: 440 }}>
        <Image src={settings.heroImage} alt="" fill sizes="100vw" style={{ objectFit: "cover", zIndex: 0 }} priority />
        <div className="container article-hero-inner">
          <span className="hero-badge" style={{ background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>
            {t("nav.about")}
          </span>
          <h1 className="article-title">{t("about.title")}</h1>
          <p style={{ color: "rgba(255,255,255,.8)", maxWidth: "58ch", marginTop: 18, fontSize: 17, lineHeight: 1.7 }}>
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      <section className="stats-band">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-value">{formatNumber(stats.members, locale)}</div>
              <div className="stat-label">{t("home.statsFamilies")}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{formatNumber(stats.states, locale)}</div>
              <div className="stat-label">{t("home.statsStates")}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{formatNumber(stats.posts, locale)}</div>
              <div className="stat-label">{locale === "ar" ? "مواضيع منشورة" : "Published stories"}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.countries}</div>
              <div className="stat-label">{locale === "ar" ? "بلدان" : "Countries"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="split-band">
            <div>
              <div className="eyebrow">{t("about.presenceTitle")}</div>
              <h2 className="section-title" style={{ fontSize: 30 }}>
                <MapPin size={24} style={{ display: "inline", marginInlineEnd: 10, color: "var(--accent)" }} />
                {locale === "ar" ? "من ديربورن إلى سان دييغو" : "From Dearborn to San Diego"}
              </h2>
              <p className="section-sub">{t("about.presenceBody")}</p>
              <div className="pill-list" style={{ marginTop: 22 }}>
                {(locale === "ar"
                  ? ["ميشيغان", "أوهايو", "تكساس", "كاليفورنيا", "أونتاريو", "ألبرتا", "كيبيك", "نوفا سكوشا"]
                  : ["Michigan", "Ohio", "Texas", "California", "Ontario", "Alberta", "Quebec", "Nova Scotia"]
                ).map((state) => (
                  <span key={state} className="tag">
                    {state}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow">{t("about.workTitle")}</div>
              <h2 className="section-title" style={{ fontSize: 30 }}>
                <Sparkles size={24} style={{ display: "inline", marginInlineEnd: 10, color: "var(--sand)" }} />
                {locale === "ar" ? "خبرات تعبر الحدود" : "Expertise that crosses borders"}
              </h2>
              <p className="section-sub">{t("about.workBody")}</p>
              <div className="qualification-list" style={{ marginTop: 18, gridTemplateColumns: "1fr 1fr" }}>
                {(locale === "ar"
                  ? ["الطب والتمريض", "الهندسة", "الأكاديميا", "المحاسبة والمالية", "اللوجستيات", "الحرف والمهن"]
                  : ["Medicine & nursing", "Engineering", "Academia", "Accounting & finance", "Logistics", "Trades"]
                ).map((item) => (
                  <div key={item} style={{ fontSize: 14, paddingBlock: 6, color: "var(--steel)" }}>
                    · {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">{t("home.pillarsEyebrow")}</div>
              <h2 className="section-title">{t("about.achievementsTitle")}</h2>
              <p className="section-sub">{t("about.achievementsBody")}</p>
            </div>
          </div>

          <div className="grid-3">
            {[
              {
                icon: <GraduationCap size={20} />,
                title: locale === "ar" ? "صناديق المنح الدراسية" : "Scholarship funds",
                body:
                  locale === "ar"
                    ? "صناديق في أوهايو وميشيغان وغيرها تغطي الكتب والرسوم للطلاب الليبيين."
                    : "Funds in Ohio, Michigan, and beyond covering books and fees for Libyan students.",
              },
              {
                icon: <Users size={20} />,
                title: locale === "ar" ? "تجمعات تملأ القاعات" : "Gatherings that fill halls",
                body:
                  locale === "ar"
                    ? "إفطارات وأعياد وحفلات تخرج تجمع مئات العائلات في كل ولاية."
                    : "Iftars, Eid celebrations, and graduations bringing hundreds of families together.",
              },
              {
                icon: <HandHeart size={20} />,
                title: locale === "ar" ? "دعم مباشر للعائلات" : "Direct family support",
                body:
                  locale === "ar"
                    ? "مساعدات هادئة للإيجار والعلاج والتنقل، بتقارير شهرية للأعضاء."
                    : "Quiet help with rent, medicine, and transport — reported to members every month.",
              },
            ].map((item) => (
              <div key={item.title} className="pillar">
                <div className="pillar-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div>
              <div className="eyebrow">{t("about.valuesTitle")}</div>
              <h2 className="section-title">{locale === "ar" ? "ثلاثة مبادئ لا نتنازل عنها" : "Three principles we do not trade"}</h2>
              <div className="stack" style={{ marginTop: 24, gap: 18 }}>
                {[t("about.value1"), t("about.value2"), t("about.value3")].map((value) => (
                  <div key={value} className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                    <ShieldCheck size={18} style={{ color: "var(--accent)", marginTop: 3, flexShrink: 0 }} />
                    <p style={{ color: "var(--steel)", fontSize: 15 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="member-card" style={{ background: "var(--ink)", color: "#fff", border: 0 }}>
              <h3 style={{ fontSize: 24 }}>{t("about.joinTitle")}</h3>
              <p style={{ color: "rgba(255,255,255,.72)", marginTop: 12, fontSize: 14.5, lineHeight: 1.75 }}>
                {t("about.joinBody")}
              </p>
              <Link href={`/${locale}/join`} className="btn btn-white" style={{ marginTop: 24 }}>
                {t("home.ctaButton")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.15)" }}>
                <p className="tiny" style={{ color: "rgba(255,255,255,.5)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  {locale === "ar" ? "للتواصل" : "Contact"}
                </p>
                <p style={{ marginTop: 8, fontSize: 14 }} dir="ltr">
                  {settings.contactEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
