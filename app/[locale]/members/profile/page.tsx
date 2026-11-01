import { Check, Info } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import { listChildren } from "@/lib/repo";
import { stateName } from "@/lib/geo";
import { formatDate } from "@/lib/format";
import { updateProfileAction } from "@/lib/actions/member";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const query = await searchParams;
  const saved = Boolean(query.saved);

  const member = await requireMember();
  const children = await listChildren(member.id);

  return (
    <>
      <div className="member-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("members.nav.profile")}</div>
          <h1>{t("members.profileTitle")}</h1>
          <p className="section-sub">{t("members.profileSub")}</p>
        </div>
        <span className="tag">
          {member.city} · {stateName(member.country, member.stateCode, locale)}
        </span>
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 18 }}>
          <Check size={14} style={{ display: "inline", marginInlineEnd: 6 }} />
          {t("members.profileSaved")}
        </div>
      )}

      <section className="member-card" style={{ marginBottom: 20 }}>
        <form action={updateProfileAction}>
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstName">{t("join.firstName")}</label>
              <input id="firstName" name="firstName" className="input" defaultValue={member.firstName ?? ""} dir="ltr" />
            </div>
            <div className="field">
              <label htmlFor="fatherName">{t("join.fatherName")}</label>
              <input id="fatherName" name="fatherName" className="input" defaultValue={member.fatherName ?? ""} dir="ltr" />
            </div>
            <div className="field">
              <label htmlFor="lastName">{t("join.lastName")}</label>
              <input id="lastName" name="lastName" className="input" defaultValue={member.lastName ?? ""} dir="ltr" />
            </div>
            <div className="field">
              <label htmlFor="phone">{t("join.phone")}</label>
              <input id="phone" name="phone" className="input" defaultValue={member.phone ?? ""} dir="ltr" />
            </div>
            <div className="field span-2">
              <label htmlFor="address">{t("join.address")}</label>
              <input id="address" name="address" className="input" defaultValue={member.address ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="educationLevel">{t("join.education")}</label>
              <input id="educationLevel" name="educationLevel" className="input" defaultValue={member.educationLevel ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="currentJob">{t("join.currentJob")}</label>
              <input id="currentJob" name="currentJob" className="input" defaultValue={member.currentJob ?? ""} />
            </div>
            <div className="field span-2">
              <label htmlFor="hardshipNotes">{t("join.hardship")}</label>
              <textarea id="hardshipNotes" name="hardshipNotes" className="textarea" rows={3} defaultValue={member.hardshipNotes ?? ""} placeholder={t("common.optional")} />
            </div>
            <div className="field span-2">
              <label htmlFor="email">{t("login.email")}</label>
              <input id="email" className="input" value={member.email} readOnly dir="ltr" style={{ background: "var(--muted)" }} />
              <span className="field-hint">{t("members.adminNote")}</span>
            </div>
          </div>
          <div className="form-actions">
            <span className="tiny muted">
              <Info size={12} style={{ display: "inline", marginInlineEnd: 4 }} />
              {t("members.fundPublicNote")}
            </span>
            <button type="submit" className="btn btn-primary">{t("common.save")}</button>
          </div>
        </form>
      </section>

      <section className="member-card">
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t("join.childrenTitle")}</h2>
        {children.length === 0 ? (
          <p className="small muted">{locale === "ar" ? "لا يوجد أبناء مسجلون." : "No children recorded."}</p>
        ) : (
          children.map((child) => (
            <div key={child.id} className="person-row">
              <span className="avatar" style={{ width: 34, height: 34, fontSize: 11 }}>{child.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <div className="person-name">{child.name}</div>
                <div className="person-meta">
                  {formatDate(child.birthDate, locale)} · {child.education ?? "—"}
                  {child.activities ? ` · ${child.activities}` : ""}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
