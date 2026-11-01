"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { COUNTRIES, citiesFor, statesFor, type CountryCode } from "@/lib/geo";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";

export function NewsFilters({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const country = (params.get("country") ?? "") as CountryCode | "";
  const stateCode = params.get("state") ?? "";
  const city = params.get("city") ?? "";
  const kind = params.get("kind") ?? "";

  const states = country ? statesFor(country) : [];
  const cities = country && stateCode ? citiesFor(country, stateCode) : [];

  function update(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    startTransition(() => router.push(`/${locale}/news?${query.toString()}`, { scroll: false }));
  }

  const kinds = [
    { value: "", label: t("news.allKinds") },
    { value: "news", label: t("news.kind.news") },
    { value: "guide", label: t("news.kind.guide") },
    { value: "jobs", label: t("news.kind.jobs") },
    { value: "success", label: t("news.kind.success") },
    { value: "idea", label: t("news.kind.idea") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pill-list" role="tablist" aria-label={t("news.filterTitle")}>
        {kinds.map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            role="tab"
            aria-selected={kind === item.value}
            onClick={() => update({ kind: item.value })}
            className="tag"
            style={{
              cursor: "pointer",
              padding: "7px 13px",
              fontSize: 12.5,
              background: kind === item.value ? "var(--ink)" : "var(--canvas)",
              color: kind === item.value ? "#fff" : "var(--steel)",
              borderColor: kind === item.value ? "var(--ink)" : "var(--line)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="filter-bar" data-pending={pending} style={{ opacity: pending ? 0.65 : 1, transition: "opacity .2s" }}>
        <div className="field">
          <label htmlFor="filter-country">{t("news.filterCountry")}</label>
          <select
            id="filter-country"
            className="select"
            value={country}
            onChange={(event) => update({ country: event.target.value, state: "", city: "" })}
          >
            <option value="">{t("common.all")}</option>
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {locale === "ar" ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-state">{t("news.filterState")}</label>
          <select
            id="filter-state"
            className="select"
            value={stateCode}
            disabled={!country}
            onChange={(event) => update({ state: event.target.value, city: "" })}
          >
            <option value="">{t("common.all")}</option>
            {states.map((item) => (
              <option key={item.code} value={item.code}>
                {locale === "ar" ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-city">{t("news.filterCity")}</label>
          <select
            id="filter-city"
            className="select"
            value={city}
            disabled={!stateCode}
            onChange={(event) => update({ city: event.target.value })}
          >
            <option value="">{t("common.all")}</option>
            {cities.map((item) => (
              <option key={`${item.name}-${item.zip}`} value={item.name}>
                {item.name} — {item.zip}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field-label">{t("news.reset")}</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => startTransition(() => router.push(`/${locale}/news`))}
          >
            <RotateCcw size={15} aria-hidden="true" />
            {t("common.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
