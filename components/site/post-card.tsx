import Link from "next/link";
import type { Locale, Post } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { formatDate, readingMinutes } from "@/lib/format";
import { Clock3 } from "lucide-react";

export function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const t = createTranslator(locale);
  const title = pickText(locale, post.titleEn, post.titleAr);
  const excerpt = pickText(locale, post.excerptEn, post.excerptAr);

  return (
    <Link href={`/${locale}/news/${post.slug}`} className="card post-card">
      <div className="post-media">
        {post.coverImage ? (
          <img src={post.coverImage} alt="" loading="lazy" />
        ) : (
          <div className="media-fallback" aria-hidden="true">
            <span>{t(`news.kind.${post.kind}` as "news.kind.news")}</span>
            <strong>{title}</strong>
          </div>
        )}
      </div>
      <div className="post-body">
        <div className="post-kicker">
          <span>{t(`news.kind.${post.kind}` as "news.kind.news")}</span>
          {post.country && (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ color: "var(--steel-soft)" }}>
                {post.city ? `${post.city}, ` : ""}
                {post.stateCode}
              </span>
            </>
          )}
        </div>
        <h3 className="post-title">{title}</h3>
        <p className="post-excerpt">{excerpt}</p>
        <div className="post-foot">
          <span>{formatDate(post.publishedAt, locale)}</span>
          <span className="row" style={{ gap: 5 }}>
            <Clock3 size={12} aria-hidden="true" />
            {readingMinutes(pickText(locale, post.bodyEn, post.bodyAr))} min
          </span>
        </div>
      </div>
    </Link>
  );
}
