import { Search, Users } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/repo";
import { stateName } from "@/lib/geo";
import { formatDate, initials } from "@/lib/format";

export default async function DirectoryPage({
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
  const q = typeof query.q === "string" ? query.q : "";

  const member = await requireMember();
  const families = await listMembers({ status: "active", search: q });

  return (
    <>
      <div className="member-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("members.fundPublicNote")}</div>
          <h1>{t("members.directoryTitle")}</h1>
          <p className="section-sub">{t("members.directorySub")}</p>
        </div>
        <span className="tag">
          <Users size={13} />
          {families.length}
        </span>
      </div>

      <form className="member-card" style={{ display: "flex", gap: 10, marginBottom: 20 }} method="get">
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--steel-soft)" }} />
          <input name="q" defaultValue={q} className="input" placeholder={t("members.directorySearch")} style={{ paddingInlineStart: 36 }} />
        </div>
        <button type="submit" className="btn btn-primary">{t("common.search")}</button>
      </form>

      {families.length === 0 ? (
        <div className="empty-state">{t("members.directoryEmpty")}</div>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {families.map((family) => {
            const name = [family.firstName, family.lastName].filter(Boolean).join(" ");
            return (
              <article key={family.id} className="member-card" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span className="avatar">{initials(name)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {name || family.email}
                    {family.id === member.id && (
                      <span className="tag tag-accent" style={{ marginInlineStart: 8, fontSize: 10 }}>
                        {locale === "ar" ? "أنت" : "You"}
                      </span>
                    )}
                  </div>
                  <div className="tiny muted" style={{ marginTop: 3 }}>
                    {family.city}, {stateName(family.country, family.stateCode, locale)} ·{" "}
                    {t("members.familySince", { date: formatDate(family.createdAt, locale, { month: "long", year: "numeric", day: undefined }) })}
                  </div>
                  <div className="stack" style={{ gap: 4, marginTop: 10, fontSize: 13 }}>
                    <span className="muted"><strong style={{ color: "var(--ink)", fontWeight: 600 }}>{t("members.workLabel")}:</strong> {family.currentJob ?? "—"}</span>
                    <span className="muted"><strong style={{ color: "var(--ink)", fontWeight: 600 }}>{t("members.educationLabel")}:</strong> {family.educationLevel ?? "—"}</span>
                    <span className="muted" dir="ltr" style={{ textAlign: "start" }}>{family.email}</span>
                    {family.phone && <span className="muted" dir="ltr" style={{ textAlign: "start" }}>{family.phone}</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
