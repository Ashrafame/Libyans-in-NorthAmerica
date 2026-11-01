import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageSquare } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { requireMember } from "@/lib/auth";
import { getProposal, listComments } from "@/lib/repo";
import { formatDateTime, initials } from "@/lib/format";
import { createCommentAction } from "@/lib/actions/member";

export default async function ProposalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const query = await searchParams;

  await requireMember();
  const proposal = await getProposal(id);
  if (!proposal) notFound();
  const comments = await listComments(id);

  return (
    <>
      <Link href={`/${locale}/members/proposals`} className="link-arrow" style={{ marginBottom: 18 }}>
        {locale === "ar" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
        {t("members.backToProposals")}
      </Link>

      <article className="member-card">
        <div className="eyebrow" style={{ marginBottom: 10 }}>{formatDateTime(proposal.createdAt, locale)}</div>
        <h1 style={{ fontSize: "clamp(22px,2.8vw,30px)", lineHeight: 1.25 }}>{proposal.title}</h1>
        <div className="row" style={{ gap: 10, marginTop: 14 }}>
          <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(proposal.authorName)}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{proposal.authorName}</div>
            <div className="tiny muted">{proposal.authorEmail}</div>
          </div>
        </div>
        <div className="prose" style={{ marginTop: 22, fontSize: 15.5 }}>
          {proposal.body.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      <section className="member-card" id="responses" style={{ marginTop: 20 }}>
        <div className="spread" style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 18 }}>{t("members.addComment")}</h2>
          <span className="tag">
            <MessageSquare size={13} />
            {t("members.comments", { count: comments.length })}
          </span>
        </div>

        {comments.length === 0 ? (
          <p className="small muted" style={{ paddingBlock: 14 }}>{t("members.noComments")}</p>
        ) : (
          <div style={{ marginBottom: 18 }}>
            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-head">
                  <span className="avatar" style={{ width: 30, height: 30, fontSize: 10.5 }}>{initials(comment.authorName)}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{comment.authorName}</div>
                    <div className="tiny muted">{formatDateTime(comment.createdAt, locale)}</div>
                  </div>
                </div>
                <p className="comment-body">{comment.body}</p>
              </div>
            ))}
          </div>
        )}

        <form action={createCommentAction} className="stack">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="proposalId" value={proposal.id} />
          <div className="field">
            <label htmlFor="body">{t("members.commentPlaceholder")}</label>
            <textarea id="body" name="body" className="textarea" required minLength={2} rows={4} />
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">{t("members.commentSubmit")}</button>
          </div>
        </form>
      </section>

      {query.error === "short" && (
        <div className="alert alert-error" style={{ marginTop: 14 }}>
          {locale === "ar" ? "الرد قصير جداً." : "That response is too short."}
        </div>
      )}
    </>
  );
}
