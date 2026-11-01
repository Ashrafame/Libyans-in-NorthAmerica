import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { listPosts } from "@/lib/repo";
import { formatNumber } from "@/lib/format";
import { PostCard } from "@/components/site/post-card";
import { NewsFilters } from "@/components/site/news-filters";

export const metadata: Metadata = {
  title: "Community news",
  description:
    "News, guides, job openings, and success stories from the Libyan community across the United States and Canada.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const query = await searchParams;

  const filters = {
    kind: first(query.kind),
    country: first(query.country),
    stateCode: first(query.state),
    city: first(query.city),
  };

  const posts = await listPosts({
    kind: filters.kind || undefined,
    country: filters.country || undefined,
    stateCode: filters.stateCode || undefined,
    city: filters.city || undefined,
  });

  return (
    <>
      <section className="section-tight" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="eyebrow">{t("nav.news")}</div>
          <h1 className="section-title" style={{ fontSize: "clamp(30px,4vw,46px)", maxWidth: "22ch" }}>
            {t("news.title")}
          </h1>
          <p className="section-sub" style={{ maxWidth: "70ch" }}>
            {t("news.subtitle")}
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <NewsFilters locale={locale} />

          <div className="spread" style={{ marginBlock: 28 }}>
            <span className="small muted">{t("common.showing", { count: formatNumber(posts.length, locale) })}</span>
            <span className="tag">
              <Newspaper size={13} aria-hidden="true" />
              {t("news.title")}
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">{t("news.empty")}</div>
          ) : (
            <div className="grid-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
