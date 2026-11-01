import { Inbox, MailOpen } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import { listInbox } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";
import { markInboxReadAction } from "@/lib/actions/member";

export default async function InboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const member = await requireMember();
  const messages = await listInbox(member.id);

  return (
    <>
      <div className="member-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("nav.inbox")}</div>
          <h1>{t("members.inboxTitle")}</h1>
        </div>
        <span className="tag">
          <Inbox size={13} />
          {messages.filter((message) => !message.readAt).length}
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">{t("members.inboxEmpty")}</div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {messages.map((message) => (
            <article key={message.id} className="member-card" style={{ borderInlineStart: message.readAt ? undefined : "3px solid var(--accent)" }}>
              <div className="spread" style={{ alignItems: "flex-start", gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <span className={`tag ${message.kind === "fund_report" ? "tag-accent" : "tag-sand"}`}>
                      {message.kind === "fund_report"
                        ? locale === "ar" ? "تقرير الصندوق" : "Fund report"
                        : locale === "ar" ? "إعلان" : "Announcement"}
                    </span>
                    <span className="tiny muted">{formatDateTime(message.createdAt, locale)}</span>
                  </div>
                  <h2 style={{ fontSize: 16.5 }}>{locale === "ar" ? message.subjectAr : message.subjectEn}</h2>
                  <p className="small" style={{ marginTop: 8, color: "var(--steel)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {locale === "ar" ? message.bodyAr : message.bodyEn}
                  </p>
                </div>

                {!message.readAt && (
                  <form action={markInboxReadAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={message.id} />
                    <button type="submit" className="btn btn-secondary btn-sm" title={t("members.inboxMarkRead")}>
                      <MailOpen size={14} />
                      {t("members.inboxMarkRead")}
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
