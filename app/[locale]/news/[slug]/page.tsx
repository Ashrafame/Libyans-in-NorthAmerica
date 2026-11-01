import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { getPostBySlug, listPosts } from "@/lib/repo";
import { formatDate, readingMinutes } from "@/lib/format";
import { PostCard } from "@/components/site/post-card";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Story" };
  return {
    title: pickText(locale as Locale, post.titleEn, post.titleAr),
    description: pickText(locale as Locale, post.excerptEn, post.excerptAr),
    openGraph: { images: post.coverImage ? [post.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") notFound();

  const body = pickText(locale, post.bodyEn, post.bodyAr);
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);
  const related = (await listPosts({ limit: 4 })).filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <>
      <article>
        <header className="article-hero">
          {post.coverImage && <img src={post.coverImage} alt="" />}
          <div className="container article-hero-inner">
            <div className="row" style={{ gap: 8 }}>
              <span
                className="tag"
                style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                {t(`news.kind.${post.kind}` as "news.kind.news")}
              </span>
              {post.country && (
                <span
                  className="tag"
                  style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
                >
                  {post.city ? `${post.city}, ` : ""}
                  {post.stateCode}
                </span>
              )}
            </div>
            <h1 className="article-title">{pickText(locale, post.titleEn, post.titleAr)}</h1>
            <div className="article-meta">
              <span>{formatDate(post.publishedAt, locale)}</span>
              <span aria-hidden="true">·</span>
              <span>{t("common.postedBy", { name: post.authorName })}</span>
              <span aria-hidden="true">·</span>
              <span className="row" style={{ gap: 5 }}>
                <Clock3 size={13} aria-hidden="true" />
                {readingMinutes(body)} {locale === "ar" ? "دقائق قراءة" : "min read"}
              </span>
            </div>
          </div>
        </header>

        <div className="container-narrow" style={{ paddingBlock: "clamp(36px,5vw,64px)" }}>
          <Link href={`/${locale}/news`} className="link-arrow" style={{ marginBottom: 28 }}>
            {locale === "ar" ? <ArrowRight size={15} aria-hidden="true" /> : <ArrowLeft size={15} aria-hidden="true" />}
            {t("news.backToNews")}
          </Link>

          <p style={{ fontSize: 20, lineHeight: 1.7, color: "var(--steel)", marginBottom: 32, fontWeight: 400 }}>
            {pickText(locale, post.excerptEn, post.excerptAr)}
          </p>

          <div className="prose">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div
            className="row"
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: "1px solid var(--line)",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span className="tag tag-sand">{locale === "ar" ? "مجتمع ليبيا في أمريكا الشمالية" : "Libyan community, North America"}</span>
            <Link href={`/${locale}/join`} className="link-arrow" style={{ marginInlineStart: "auto" }}>
              {t("home.ctaButton")}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section section-muted">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">{t("home.latestEyebrow")}</div>
                <h2 className="section-title">{t("news.relatedTitle")}</h2>
              </div>
              <Link href={`/${locale}/news`} className="link-arrow">
                {t("home.viewAll")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid-3">
              {related.map((item) => (
                <PostCard key={item.id} post={item} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
