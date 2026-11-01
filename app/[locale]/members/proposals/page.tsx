import Link from "next/link";
import { Lightbulb, MessageSquare, Plus } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import { listAllComments, listProposals } from "@/lib/repo";
import { formatDate } from "@/lib/format";
import { createProposalAction } from "@/lib/actions/member";

export default async function ProposalsPage({
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
  const error = typeof query.error === "string" ? query.error : undefined;

  await requireMember();
  const [proposals, comments] = await Promise.all([listProposals(), listAllComments()]);

  return (
    <>
      <div className="member-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t("nav.proposals")}</div>
          <h1>{t("members.proposalsTitle")}</h1>
          <p className="section-sub">{t("members.proposalsSub")}</p>
        </div>
      </div>

      {error === "short" && (
        <div className="alert alert-error" style={{ marginBottom: 18 }}>
          {locale === "ar" ? "العنوان قصير جداً أو النص أقل من 20 حرفاً." : "The title is too short or the text is under 20 characters."}
        </div>
      )}

      <details className="member-card" style={{ marginBottom: 22 }}>
        <summary className="row" style={{ gap: 10, cursor: "pointer", fontWeight: 600, color: "var(--accent)", listStyle: "none" }}>
          <Plus size={17} />
          {t("members.newProposal")}
        </summary>
        <form action={createProposalAction} className="stack" style={{ marginTop: 18 }}>
          <input type="hidden" name="locale" value={locale} />
          <div className="field">
            <label htmlFor="title">{t("members.proposalTitle")}</label>
            <input id="title" name="title" className="input" required minLength={5} maxLength={140} />
          </div>
          <div className="field">
            <label htmlFor="body">{t("members.proposalBody")}</label>
            <textarea id="body" name="body" className="textarea" required minLength={20} rows={5} />
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">{t("members.proposalSubmit")}</button>
          </div>
        </form>
      </details>

      {proposals.length === 0 ? (
        <div className="empty-state">{t("members.proposalEmpty")}</div>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {proposals.map((proposal) => {
            const count = comments.filter((comment) => comment.proposalId === proposal.id).length;
            return (
              <Link key={proposal.id} href={`/${locale}/members/proposals/${proposal.id}`} className="member-card">
                <div className="spread" style={{ alignItems: "flex-start", gap: 18 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                      <Lightbulb size={16} style={{ color: "var(--sand)" }} />
                      <h2 style={{ fontSize: 17, lineHeight: 1.35 }}>{proposal.title}</h2>
                    </div>
                    <p className="small muted" style={{ lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {proposal.body}
                    </p>
                    <div className="tiny muted" style={{ marginTop: 10 }}>
                      {proposal.authorName} · {formatDate(proposal.createdAt, locale)}
                    </div>
                  </div>
                  <span className="tag" style={{ flexShrink: 0 }}>
                    <MessageSquare size={13} />
                    {count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
