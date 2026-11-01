import { CalendarDays } from "lucide-react";
import type { CommunityEvent, Locale } from "@/lib/types";
import { createTranslator, pickText } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

export function EventCard({ event, locale }: { event: CommunityEvent; locale: Locale }) {
  const t = createTranslator(locale);
  const title = pickText(locale, event.titleEn, event.titleAr);
  const body = pickText(locale, event.bodyEn, event.bodyAr);

  return (
    <article className="card post-card">
      <div className="post-media">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="media-fallback" aria-hidden="true" style={{ background: "linear-gradient(135deg,#2b2f33,#4a4f54)" }}>
            <span>{t("events.displayUntil", { date: formatDate(event.announceUntil, locale) })}</span>
            <strong>{title}</strong>
          </div>
        )}
      </div>
      <div className="post-body">
        <div className="post-kicker">
          <CalendarDays size={13} aria-hidden="true" />
          <span>{formatDate(event.announceUntil, locale)}</span>
        </div>
        <h3 className="post-title">{title}</h3>
        <p className="post-excerpt">{body}</p>
      </div>
    </article>
  );
}
