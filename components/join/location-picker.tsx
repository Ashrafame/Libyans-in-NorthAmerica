"use client";

import { useMemo, useState } from "react";
import { COUNTRIES, citiesFor, statesFor, type CountryCode } from "@/lib/geo";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";

export function LocationPicker({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const [country, setCountry] = useState<CountryCode | "">("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");

  const states = country ? statesFor(country) : [];
  const cities = country && stateCode ? citiesFor(country, stateCode) : [];
  const postal = useMemo(
    () => cities.find((item) => item.name === city)?.zip ?? "",
    [cities, city],
  );

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="join-country">{t("common.country")}</label>
        <select
          id="join-country"
          name="country"
          className="select"
          required
          value={country}
          onChange={(event) => {
            setCountry(event.target.value as CountryCode | "");
            setStateCode("");
            setCity("");
          }}
        >
          <option value="">{t("common.selectCountry")}</option>
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {locale === "ar" ? item.nameAr : item.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="join-state">{t("common.state")}</label>
        <select
          id="join-state"
          name="stateCode"
          className="select"
          required
          value={stateCode}
          disabled={!country}
          onChange={(event) => {
            setStateCode(event.target.value);
            setCity("");
          }}
        >
          <option value="">{t("common.selectState")}</option>
          {states.map((item) => (
            <option key={item.code} value={item.code}>
              {locale === "ar" ? item.nameAr : item.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="join-city">{t("common.city")}</label>
        <select
          id="join-city"
          name="city"
          className="select"
          required
          value={city}
          disabled={!stateCode}
          onChange={(event) => setCity(event.target.value)}
        >
          <option value="">{t("common.selectCity")}</option>
          {cities.map((item) => (
            <option key={`${item.name}-${item.zip}`} value={item.name}>
              {item.name} — {item.zip}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="join-postal">{locale === "ar" ? "الرمز البريدي" : "Postal code"}</label>
        <input
          id="join-postal"
          name="postalCode"
          className="input"
          value={postal}
          readOnly
          placeholder="—"
          dir="ltr"
        />
      </div>
    </div>
  );
}
