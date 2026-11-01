import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listAllComments, listProposals } from "@/lib/repo";
import { formatDate } from "@/lib/format";
import { deleteProposalAction, setProposalStatusAction } from "@/lib/actions/admin";
import { AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "proposals")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const saved = Boolean(query.saved);
  const deleted = Boolean(query.deleted);
  const canEdit = canWrite(admin.role, "proposals");

  const [proposals, comments] = await Promise.all([listProposals({ includeHidden: true }), listAllComments()]);

  return (
    <>
      <AdminHead
        title="Member suggestions"
        sub="Moderate the suggestion box. Every deletion is recorded in the audit log with the author and time."
      />

      {saved && <AdminNotice tone="ok">Suggestion updated.</AdminNotice>}
      {deleted && <AdminNotice tone="ok">Suggestion hidden and recorded in the audit log.</AdminNotice>}

      <AdminPanel>
        {proposals.length === 0 ? (
          <AdminEmpty>No suggestions yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Suggestion</th>
                <th>Author</th>
                <th>Responses</th>
                <th>Posted</th>
                <th>Status</th>
                <th style={{ textAlign: "end" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => {
                const count = comments.filter((comment) => comment.proposalId === proposal.id).length;
                return (
                  <tr key={proposal.id}>
                    <td style={{ maxWidth: 420 }}>
                      <div style={{ fontWeight: 500 }}>{proposal.title}</div>
                      <div
                        style={{
                          color: "#8fa1af",
                          fontSize: 11.5,
                          marginTop: 4,
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {proposal.body}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {proposal.authorName}
                      <div style={{ color: "#6b7f8e", fontSize: 11 }}>{proposal.authorEmail}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{count}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(proposal.createdAt, "en")}</td>
                    <td>
                      <StatusBadge tone={proposal.status === "open" ? "green" : "red"}>
                        {proposal.status === "open" ? "Open" : "Hidden"}
                      </StatusBadge>
                    </td>
                    <td style={{ textAlign: "end", whiteSpace: "nowrap" }}>
                      {canEdit && (
                        <>
                          <form action={setProposalStatusAction} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={proposal.id} />
                            <input type="hidden" name="status" value={proposal.status === "open" ? "hidden" : "open"} />
                            <button type="submit" className="admin-btn admin-btn-sm">
                              {proposal.status === "open" ? "Hide" : "Re-open"}
                            </button>
                          </form>{" "}
                          <form action={deleteProposalAction} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={proposal.id} />
                            <ConfirmButton message="Delete this suggestion? It will be hidden and the deletion recorded.">
                              Delete
                            </ConfirmButton>
                          </form>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </>
  );
}
