import { UserPlus } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { listAdmins } from "@/lib/repo";
import { ADMIN_ROLES } from "@/lib/rbac";
import { formatDate } from "@/lib/format";
import { createAdminAction, toggleAdminAction } from "@/lib/actions/admin";
import { AField, ASelect, AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrator",
  content_manager: "Content manager",
  events_manager: "Events manager",
  donations_manager: "Donations manager",
  viewer: "Observer",
};

export default async function AdminAdminsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const query = await searchParams;
  const saved = Boolean(query.saved);
  const error = typeof query.error === "string" ? query.error : undefined;

  if (admin.role !== "super_admin") {
    return <AdminNotice tone="error">Only a super admin can manage administrator accounts.</AdminNotice>;
  }

  const admins = await listAdmins();

  return (
    <>
      <AdminHead
        title="Administrators"
        sub="Create console accounts and assign their level of access. Every action they take is recorded."
      />

      {saved && <AdminNotice tone="ok">Administrator saved.</AdminNotice>}
      {error === "taken" && <AdminNotice tone="error">An administrator already uses this email.</AdminNotice>}
      {error === "required" && (
        <AdminNotice tone="error">Name, email, a password of at least 8 characters, and a role are required.</AdminNotice>
      )}
      {error === "self" && <AdminNotice tone="error">You cannot disable your own account.</AdminNotice>}

      <AdminPanel title="New administrator" style={{ marginBottom: 20 }}>
        <form action={createAdminAction}>
          <div className="admin-grid admin-grid-2">
            <AField label="Full name" name="name" required />
            <AField label="Email" name="email" type="email" required />
            <ASelect
              label="Role"
              name="role"
              defaultValue="viewer"
              options={ADMIN_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }))}
            />
            <AField label="Temporary password" name="password" type="password" required hint="At least 8 characters." />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button type="submit" className="admin-btn admin-btn-primary">
              <UserPlus size={14} /> Create administrator
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title={`Console accounts (${admins.length})`}>
        {admins.length === 0 ? (
          <AdminEmpty>No administrators.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th style={{ textAlign: "end" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((account) => (
                <tr key={account.id}>
                  <td style={{ fontSize: 12.5 }}>{account.name}</td>
                  <td style={{ fontSize: 12 }}>{account.email}</td>
                  <td>
                    <StatusBadge tone={account.role === "super_admin" ? "blue" : "default"}>
                      {ROLE_LABEL[account.role]}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={account.active ? "green" : "red"}>
                      {account.active ? "Active" : "Disabled"}
                    </StatusBadge>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(account.lastLoginAt, "en")}</td>
                  <td style={{ textAlign: "end" }}>
                    {account.id !== admin.id && (
                      <form action={toggleAdminAction}>
                        <input type="hidden" name="id" value={account.id} />
                        <input type="hidden" name="active" value={String(!account.active)} />
                        <button
                          type="submit"
                          className={`admin-btn admin-btn-sm ${account.active ? "admin-btn-danger" : ""}`}
                        >
                          {account.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>

      <AdminPanel title="Role capabilities" style={{ marginTop: 16 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Super admin</td>
              <td style={{ fontSize: 12, color: "#9fb2c0" }}>
                Everything, including administrators, banking details, the audit log, and site appearance.
              </td>
            </tr>
            <tr>
              <td>Administrator</td>
              <td style={{ fontSize: 12, color: "#9fb2c0" }}>
                Content, events, members, suggestions, funds, and appearance — no administrator or audit access.
              </td>
            </tr>
            <tr>
              <td>Content manager</td>
              <td style={{ fontSize: 12, color: "#9fb2c0" }}>News, events, suggestions, and volunteer questions.</td>
            </tr>
            <tr>
              <td>Events manager</td>
              <td style={{ fontSize: 12, color: "#9fb2c0" }}>
                Events only — including creation, colour choices, and deletion with an audit entry.
              </td>
            </tr>
            <tr>
              <td>Donations manager</td>
              <td style={{ fontSize: 12, color: "#9fb2c0" }}>Donations, fund reports, and committees.</td>
            </tr>
            <tr>
              <td>Observer</td>
              <td style={{ fontSize: 12, color: "#9fb2c0" }}>Read-only across the console.</td>
            </tr>
          </tbody>
        </table>
      </AdminPanel>
    </>
  );
}
