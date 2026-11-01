import { Megaphone } from "lucide-react";
import type { Locale } from "@/lib/types";
import { pickText } from "@/lib/i18n";

export function NoticeTicker({
  items,
  locale,
  label,
}: {
  items: { id: string; textEn: string; textAr: string; bg: string; color: string }[];
  locale: Locale;
  label: string;
}) {
  if (items.length === 0) return null;
  const first = items[0];

  return (
    <div
      className="ticker"
      style={{ background: first.bg, color: first.color }}
      role="region"
      aria-label={label}
    >
      <span className="ticker-label">
        <Megaphone size={13} aria-hidden="true" />
        {label}
      </span>
      <div className="ticker-viewport">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="row" style={{ gap: 64 }} aria-hidden={copy === 1}>
              {items.map((item) => (
                <span key={`${copy}-${item.id}`} className="ticker-item">
                  {pickText(locale, item.textEn, item.textAr)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
