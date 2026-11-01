import { CA_CITIES, CA_PROVINCES, COUNTRIES, US_CITIES, US_STATES, type CountryCode, type GeoCity, type GeoState } from "./data";
import type { Locale } from "../types";

export * from "./data";

export function statesFor(country: CountryCode | null | undefined): GeoState[] {
  if (country === "US") return US_STATES;
  if (country === "CA") return CA_PROVINCES;
  return [];
}

export function citiesFor(country: CountryCode | null | undefined, stateCode: string | null | undefined): GeoCity[] {
  if (!country || !stateCode) return [];
  const table = country === "US" ? US_CITIES : CA_CITIES;
  return table[stateCode] ?? [];
}

export function stateName(country: CountryCode | null | undefined, code: string | null | undefined, locale: Locale): string {
  if (!code) return "";
  const state = statesFor(country).find((s) => s.code === code);
  if (!state) return code;
  return locale === "ar" ? state.nameAr : state.nameEn;
}

export function stateOptions(country: CountryCode) {
  return statesFor(country);
}

export function countryName(code: CountryCode | null | undefined, locale: Locale): string {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) return "";
  return locale === "ar" ? country.nameAr : country.nameEn;
}

export function countryOptions() {
  return COUNTRIES;
}

/** Resolves a postal code for a city so the join form can pre-fill it. */
export function postalCodeFor(country: CountryCode, stateCode: string, city: string): string {
  return citiesFor(country, stateCode).find((c) => c.name === city)?.zip ?? "";
}
