import type { Locale } from "./types";

export function formatDate(value: string | null | undefined, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  // ar-LY keeps Arabic month names but uses Western digits (١٢٣ → 123),
  // which is what Libyan readers expect and what the design asks for.
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined, locale: Locale) {
  return formatDate(value, locale, { hour: "numeric", minute: "2-digit" });
}

export function formatMoney(cents: number, locale: Locale) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatNumber(value: number, locale: Locale) {
  // Numbers always use Western digits, including on the Arabic site.
  void locale;
  return new Intl.NumberFormat("en-US").format(value);
}

export function daysLeft(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, length = 160) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}
