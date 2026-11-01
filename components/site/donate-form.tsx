"use client";

import { useState } from "react";
import { CreditCard, HeartHandshake } from "lucide-react";
import { COUNTRIES, citiesFor, statesFor, type CountryCode } from "@/lib/geo";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { donateAction } from "@/lib/actions/donate";

export function DonateForm({
  locale,
  defaultCountry,
  defaultState,
  defaultCity,
  capCents,
  memberName,
  memberEmail,
  demo,
}: {
  locale: Locale;
  defaultCountry: CountryCode;
  defaultState: string;
  defaultCity: string;
  capCents: number;
  memberName: string;
  memberEmail: string;
  demo: boolean;
}) {
  const t = createTranslator(locale);
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [stateCode, setStateCode] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);
  const [amount, setAmount] = useState(capCents / 100);

  const states = statesFor(country);
  const cities = stateCode ? citiesFor(country, stateCode) : [];
  const cap = capCents / 100;

  return (
    <form action={donateAction} className="stack" style={{ gap: 16 }}>
      <input type="hidden" name="locale" value={locale} />

      <div className="form-grid">
        <div className="field">
          <label htmlFor="country">{t("common.country")}</label>
          <select
            id="country"
            name="country"
            className="select"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value as CountryCode);
              setStateCode("");
              setCity("");
            }}
            required
          >
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {locale === "ar" ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="stateCode">{t("donate.chooseState")}</label>
          <select
            id="stateCode"
            name="stateCode"
            className="select"
            value={stateCode}
            onChange={(event) => {
              setStateCode(event.target.value);
              setCity("");
            }}
            required
          >
            <option value="">{t("common.selectState")}</option>
            {states.map((item) => (
              <option key={item.code} value={item.code}>
                {locale === "ar" ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </div>

        {cities.length > 0 && (
          <div className="field">
            <label htmlFor="city">{t("common.city")}</label>
            <select
              id="city"
              name="city"
              className="select"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="">{t("common.all")}</option>
              {cities.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="amount">{t("donate.amount")}</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={1}
            max={cap}
            step="0.01"
            className="input"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            required
            dir="ltr"
          />
          <span className="field-hint">{t("members.donationCapped", { cap })}</span>
        </div>

        <div className="field">
          <label htmlFor="donorName">{t("donate.donorName")}</label>
          <input id="donorName" name="donorName" className="input" defaultValue={memberName} required />
        </div>

        <div className="field">
          <label htmlFor="donorEmail">{t("donate.donorEmail")}</label>
          <input
            id="donorEmail"
            name="donorEmail"
            type="email"
            className="input"
            defaultValue={memberEmail}
            required
            dir="ltr"
          />
        </div>

        <div className="field span-2">
          <label htmlFor="note">{t("donate.note")}</label>
          <input id="note" name="note" className="input" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-lg">
        {demo ? <HeartHandshake size={17} /> : <CreditCard size={17} />}
        {demo ? t("donate.demoButton") : t("donate.button")}
      </button>

      <p className="tiny muted">{demo ? t("donate.demoNote") : t("donate.secure")}</p>
    </form>
  );
}
