"use client";

import { useState } from "react";
import { COUNTRIES, citiesFor, statesFor, type CountryCode } from "@/lib/geo";

export function AdminGeoPicker({
  defaultCountry,
  defaultState,
  defaultCity,
  showCity = true,
}: {
  defaultCountry?: string | null;
  defaultState?: string | null;
  defaultCity?: string | null;
  showCity?: boolean;
}) {
  const [country, setCountry] = useState<CountryCode | "">((defaultCountry as CountryCode) ?? "");
  const [stateCode, setStateCode] = useState(defaultState ?? "");
  const states = country ? statesFor(country) : [];
  const cities = country && stateCode ? citiesFor(country, stateCode) : [];

  return (
    <>
      <div className="admin-field">
        <label htmlFor="country">Country</label>
        <select
          id="country"
          name="country"
          className="admin-select"
          value={country}
          onChange={(event) => {
            setCountry(event.target.value as CountryCode | "");
            setStateCode("");
          }}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label htmlFor="stateCode">State / Province</label>
        <select
          id="stateCode"
          name="stateCode"
          className="admin-select"
          value={stateCode}
          onChange={(event) => setStateCode(event.target.value)}
          disabled={!country}
        >
          <option value="">All states</option>
          {states.map((item) => (
            <option key={item.code} value={item.code}>
              {item.nameEn}
            </option>
          ))}
        </select>
      </div>

      {showCity && (
        <div className="admin-field">
          <label htmlFor="city">City</label>
          <select id="city" name="city" className="admin-select" defaultValue={defaultCity ?? ""} disabled={!stateCode}>
            <option value="">All cities</option>
            {cities.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
