import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "site",
  titleEn: "Libyans in North America",
  titleAr: "ليبيون في أمريكا الشمالية",
  taglineEn: "One community across two countries — a home away from home.",
  taglineAr: "مجتمع واحد في بلدين — بيت بعيد عن الديار.",

  accentColor: "#0067b8",
  accentDarkColor: "#004f8c",
  inkColor: "#11161b",
  canvasColor: "#ffffff",
  mutedColor: "#f3f5f7",

  headingFontEn: "Tahoma",
  headingFontAr: "Cairo",
  bodyFontEn: "Tahoma",
  bodyFontAr: "Cairo",
  headingSize: 46,
  bodySize: 16,

  cardRadius: 4,
  buttonRadius: 3,
  inputRadius: 3,

  heroImage: "/images/hero.jpg",
  heroBadgeEn: "United States · Canada",
  heroBadgeAr: "الولايات المتحدة · كندا",
  heroTitleEn: "Libyans in North America",
  heroTitleAr: "ليبيون في أمريكا الشمالية",
  heroSubtitleEn:
    "A shared home for Libyan families across the United States and Canada — our people, our skills, our stories, and the work we do together.",
  heroSubtitleAr:
    "بيت جامع للعائلات الليبية في الولايات المتحدة وكندا — ناسنا، مهاراتنا، حكاياتنا، والعمل الذي ننجزه معاً.",

  footerAboutEn:
    "A community-built platform connecting Libyan families across the United States and Canada, and introducing the world to the Libyan diaspora.",
  footerAboutAr:
    "منصة بناها المجتمع لربط العائلات الليبية في الولايات المتحدة وكندا، وتعريف العالم بالجاليات الليبية.",
  contactEmail: "hello@libyansna.org",
  adminEmail: "admin@libyansna.org",
  phones: ["+1 (313) 555-0142", "+1 (416) 555-0198"],

  facebookUrl: "https://facebook.com/groups/libyansna",
  xUrl: "https://x.com/libyansna",
  tiktokUrl: "https://tiktok.com/@libyansna",
  instagramUrl: "https://instagram.com/libyansna",
  youtubeUrl: "",

  membershipCtaEn: "Become a member of the Libyan family",
  membershipCtaAr: "كن عضواً من العائلة الليبية",

  monthlyCapCents: 1000,
  stripeAccountHolder: "Libyans in North America — Community Fund",
  stripeAccountNumber: "",
  stripeRoutingNumber: "",

  tickerEnabled: true,

  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

export function mergeSettings(partial: Partial<SiteSettings> | null | undefined): SiteSettings {
  if (!partial) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...partial, id: "site" };
}

function fontStack(name: string, locale: "en" | "ar") {
  const fallback =
    locale === "ar"
      ? "'Cairo Variable', 'Cairo', 'Noto Sans Arabic', Tahoma, system-ui, sans-serif"
      : "Tahoma, 'Segoe UI', system-ui, -apple-system, sans-serif";
  const clean = name.trim().toLowerCase();
  if (!clean) return fallback;
  if (clean === "tahoma") return fallback;
  // The bundled variable font registers itself as "Cairo Variable", so it must
  // come first for the Arabic default — otherwise a missing local "Cairo" can
  // silently fall through to Tahoma on some devices.
  if (locale === "ar" && clean === "cairo") {
    return "'Cairo Variable', 'Cairo', 'Noto Sans Arabic', Tahoma, system-ui, sans-serif";
  }
  return `'${name.trim()}', ${fallback}`;
}

/** Builds the CSS custom properties injected from admin-controlled settings. */
export function settingsCssVariables(settings: SiteSettings, locale: "en" | "ar"): string {
  const heading = locale === "ar" ? settings.headingFontAr : settings.headingFontEn;
  const body = locale === "ar" ? settings.bodyFontAr : settings.bodyFontEn;
  return [
    `--accent:${settings.accentColor}`,
    `--accent-dark:${settings.accentDarkColor}`,
    `--ink:${settings.inkColor}`,
    `--canvas:${settings.canvasColor}`,
    `--muted:${settings.mutedColor}`,
    `--font-heading:${fontStack(heading, locale)}`,
    `--font-body:${fontStack(body, locale)}`,
    `--heading-size:${settings.headingSize}px`,
    `--body-size:${settings.bodySize}px`,
    `--radius-card:${settings.cardRadius}px`,
    `--radius-button:${settings.buttonRadius}px`,
    `--radius-input:${settings.inputRadius}px`,
  ].join(";");
}
