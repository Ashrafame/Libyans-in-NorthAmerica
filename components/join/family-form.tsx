"use client";

import { useState } from "react";
import type { Locale, MaritalStatus } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { backAction, familyAction } from "@/lib/actions/join";

export function FamilyForm({
  locale,
  initial,
}: {
  locale: Locale;
  initial: {
    maritalStatus: MaritalStatus | null;
    spouseName: string | null;
    householdSize: number | null;
    hasDependents: boolean | null;
    sonsCount: number;
    daughtersCount: number;
  };
}) {
  const t = createTranslator(locale);
  const [status, setStatus] = useState<MaritalStatus | "">(initial.maritalStatus ?? "");
  const [householdSize, setHouseholdSize] = useState<number>(initial.householdSize ?? 2);
  const [hasDependents, setHasDependents] = useState<boolean | null>(initial.hasDependents);
  const [sons, setSons] = useState<number>(initial.sonsCount ?? 0);
  const [daughters, setDaughters] = useState<number>(initial.daughtersCount ?? 0);

  const marriedWithChildren = status === "married" && householdSize > 2;
  const widowedWithChildren = (status === "widowed" || status === "divorced") && hasDependents === true;
  const singleChild = widowedWithChildren && householdSize === 2;
  const multipleChildren = (marriedWithChildren || widowedWithChildren) && householdSize > 2;
  const childrenTotal = sons + daughters;
  const expectedChildren = widowedWithChildren ? householdSize - 1 : householdSize - 2;
  const countMismatch = multipleChildren && childrenTotal !== expectedChildren;

  return (
    <form action={familyAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="to" value="personal" />

      <div className="field" style={{ marginBottom: 20 }}>
        <span className="field-label">{t("join.maritalStatus")}</span>
        <div className="radio-grid-4">
          {(["married", "widowed", "divorced", "single"] as MaritalStatus[]).map((value) => (
            <label key={value} className="choice">
              <input
                type="radio"
                name="maritalStatus"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                required
              />
              <span>{t(`join.${value}` as "join.married")}</span>
            </label>
          ))}
        </div>
      </div>

      {status === "married" && (
        <>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="spouseName">{t("join.spouseName")}</label>
              <input
                id="spouseName"
                name="spouseName"
                className="input"
                defaultValue={initial.spouseName ?? ""}
                placeholder={t("common.optional")}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="householdSize">{t("join.householdSize")}</label>
            <input
              id="householdSize"
              name="householdSize"
              type="number"
              min={2}
              max={30}
              className="input"
              value={householdSize}
              onChange={(event) => setHouseholdSize(Math.max(2, Number(event.target.value) || 2))}
              required
            />
            <span className="field-hint">{t("join.householdHint")}</span>
          </div>
        </>
      )}

      {(status === "widowed" || status === "divorced") && (
        <>
          <div className="field" style={{ marginTop: 4 }}>
            <span className="field-label">{t("join.hasDependents")}</span>
            <div className="radio-grid">
              <label className="choice">
                <input
                  type="radio"
                  name="hasDependents"
                  value="true"
                  checked={hasDependents === true}
                  onChange={() => setHasDependents(true)}
                  required
                />
                <span>{t("common.yes")}</span>
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="hasDependents"
                  value="false"
                  checked={hasDependents === false}
                  onChange={() => {
                    setHasDependents(false);
                    setHouseholdSize(1);
                  }}
                  required
                />
                <span>{t("common.no")}</span>
              </label>
            </div>
          </div>

          {hasDependents === true && (
            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="householdSizeW">{t("join.householdSize")}</label>
              <input
                id="householdSizeW"
                name="householdSize"
                type="number"
                min={2}
                max={30}
                className="input"
                value={householdSize}
                onChange={(event) => setHouseholdSize(Math.max(2, Number(event.target.value) || 2))}
                required
              />
            </div>
          )}
        </>
      )}

      {singleChild && (
        <div className="field" style={{ marginTop: 18 }}>
          <span className="field-label">{t("join.childOneType")}</span>
          <div className="radio-grid">
            <label className="choice">
              <input type="radio" name="singleChildGender" value="male" required />
              <span>{t("join.male")}</span>
            </label>
            <label className="choice">
              <input type="radio" name="singleChildGender" value="female" required />
              <span>{t("join.female")}</span>
            </label>
          </div>
        </div>
      )}

      {multipleChildren && (
        <>
          <div className="form-grid" style={{ marginTop: 18 }}>
            <div className="field">
              <label htmlFor="sonsCount">{t("join.sonsCount")}</label>
              <input
                id="sonsCount"
                name="sonsCount"
                type="number"
                min={0}
                max={20}
                className="input"
                value={sons}
                onChange={(event) => setSons(Math.max(0, Number(event.target.value) || 0))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="daughtersCount">{t("join.daughtersCount")}</label>
              <input
                id="daughtersCount"
                name="daughtersCount"
                type="number"
                min={0}
                max={20}
                className="input"
                value={daughters}
                onChange={(event) => setDaughters(Math.max(0, Number(event.target.value) || 0))}
                required
              />
            </div>
          </div>
          <p className={`small ${countMismatch ? "" : "muted"}`} style={{ marginTop: 8, color: countMismatch ? "var(--danger)" : undefined }}>
            {locale === "ar"
              ? `المتوقع ${expectedChildren} أبناء (${sons} ذكور + ${daughters} إناث)`
              : `Expected ${expectedChildren} children (${sons} sons + ${daughters} daughters)`}
          </p>
        </>
      )}

      <div className="form-actions">
        <button type="submit" formAction={backAction} className="btn btn-secondary">
          {t("common.back")}
        </button>
        <button type="submit" className="btn btn-primary">
          {t("common.next")}
        </button>
      </div>
    </form>
  );
}
