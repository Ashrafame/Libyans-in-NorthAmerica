import Link from "next/link";
import type { Locale, SiteSettings } from "@/lib/types";
import { pickText } from "@/lib/i18n";

export function Brand({
  locale,
  settings,
  compact = false,
}: {
  locale: Locale;
  settings: SiteSettings;
  compact?: boolean;
}) {
  return (
    <Link href={`/${locale}`} className="brand" aria-label={pickText(locale, settings.titleEn, settings.titleAr)}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M16.5 3.6a8.6 8.6 0 1 0 3.9 14.7A8.8 8.8 0 0 1 16.5 3.6Z"
            fill="currentColor"
          />
          <path
            d="m19.4 7.2.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.5-.5 1.5-.5.5-1.4Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {!compact && (
        <span className="brand-text">
          <span className="brand-name">{pickText(locale, settings.titleEn, settings.titleAr)}</span>
          <span className="brand-tag">
            {locale === "ar" ? "الولايات المتحدة · كندا" : "United States · Canada"}
          </span>
        </span>
      )}
    </Link>
  );
}
