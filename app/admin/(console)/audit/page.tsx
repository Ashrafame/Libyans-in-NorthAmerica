import { getCurrentAdmin } from "@/lib/auth";
import { listAudit } from "@/lib/repo";
import { formatDate } from "@/lib/format";
import { AdminHead, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";

const ACTION_TONE: Record<string, "green" | "amber" | "red" | "blue" | "default"> = {
  create: "green",
  update: "blue",
  delete: "red",
  publish: "green",
  login: "default",
  payout: "amber",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  if (admin.role !== "super_admin") {
    return (
      <AdminPanel>
        <AdminEmpty>The audit log is restricted to the super admin.</AdminEmpty>
      </AdminPanel>
    );
  }

  const query = await searchParams;
  const action = typeof query.action === "string" ? query.action : "";
  const entries = (await listAudit()).filter((entry) => (action ? entry.action === action : true));

  return (
    <>
      <AdminHead
        title="Audit log"
        sub="Every create, update, delete, publish, and sign-in recorded across the console. Visible to the super admin only."
      />

      <div className="admin-tabs">
        {["", "create", "update", "delete", "publish", "login"].map((value) => (
          <a key={value || "all"} href={value ? `/admin/audit?action=${value}` : "/admin/audit"} className="admin-tab" data-active={action === value}>
            {value || "All activity"}
          </a>
        ))}
      </div>

      <AdminPanel>
        {entries.length === 0 ? (
          <AdminEmpty>No activity recorded yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Object</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatDate(entry.createdAt, "en", { hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {entry.actorName}
                    <div style={{ color: "#6b7f8e", fontSize: 11 }}>{entry.actorRole}</div>
                  </td>
                  <td>
                    <StatusBadge tone={ACTION_TONE[entry.action] ?? "default"}>{entry.action}</StatusBadge>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {entry.entity}
                    <div style={{ color: "#6b7f8e", fontSize: 10.5 }}>{entry.entityId.slice(0, 8)}</div>
                  </td>
                  <td style={{ fontSize: 12, color: "#b9c8d3", maxWidth: 460 }}>{entry.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </>
  );
}
