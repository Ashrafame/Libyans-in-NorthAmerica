import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listChildren, listMembers } from "@/lib/repo";
import { formatDate, formatMoney } from "@/lib/format";
import { stateName } from "@/lib/geo";
import { setMemberStatusAction } from "@/lib/actions/admin";
import { AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "default"> = {
  active: "green",
  onboarding: "amber",
  pending_verification: "amber",
  suspended: "red",
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "members")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const country = typeof query.country === "string" ? query.country : "";
  const status = typeof query.status === "string" ? query.status : "";
  const saved = Boolean(query.saved);

  const members = await listMembers({
    search: q || undefined,
    country: country || undefined,
    status: status || undefined,
  });
  const children = await Promise.all(members.slice(0, 50).map((member) => listChildren(member.id)));
  const counts = new Map(members.slice(0, 50).map((member, index) => [member.id, children[index].length]));
  const canEdit = canWrite(admin.role, "members");

  return (
    <>
      <AdminHead
        title="Community members"
        sub="Every verified family, with the details they chose to share. This data is never published publicly."
      />

      {saved && <AdminNotice tone="ok">Member updated.</AdminNotice>}

      <AdminPanel style={{ marginBottom: 16 }}>
        <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="admin-field" style={{ flex: "1 1 260px" }}>
            <label htmlFor="q">Search</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", insetInlineStart: 10, top: 11, color: "#6b7f8e" }} />
              <input
                id="q"
                name="q"
                defaultValue={q}
                className="admin-input"
                placeholder="Name, email, city, or work"
                style={{ paddingInlineStart: 30 }}
              />
            </div>
          </div>
          <div className="admin-field" style={{ width: 150 }}>
            <label htmlFor="country">Country</label>
            <select id="country" name="country" className="admin-select" defaultValue={country}>
              <option value="">All</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
          <div className="admin-field" style={{ width: 170 }}>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" className="admin-select" defaultValue={status}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="onboarding">Incomplete</option>
              <option value="pending_verification">Unverified</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button type="submit" className="admin-btn">
            Apply
          </button>
          <Link href="/admin/members" className="admin-btn admin-btn-sm">
            Clear
          </Link>
        </form>
      </AdminPanel>

      <AdminPanel>
        {members.length === 0 ? (
          <AdminEmpty>No members match this view.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Family</th>
                <th>Location</th>
                <th>Household</th>
                <th>Status</th>
                <th style={{ textAlign: "end" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "—";
                const kids = counts.get(member.id) ?? 0;
                return (
                  <tr key={member.id}>
                    <td style={{ maxWidth: 340 }}>
                      <details>
                        <summary style={{ cursor: "pointer", listStyle: "none" }}>
                          <span style={{ fontWeight: 500 }}>{name}</span>
                          <span style={{ color: "#6b7f8e", fontSize: 11.5, marginInlineStart: 8 }}>{member.email}</span>
                        </summary>
                        <div
                          style={{
                            marginTop: 10,
                            padding: 12,
                            background: "#131b22",
                            border: "1px solid #26323c",
                            borderRadius: 8,
                            fontSize: 12,
                            lineHeight: 1.8,
                            color: "#b9c8d3",
                          }}
                        >
                          <div>
                            <strong>Phone:</strong> {member.phone ?? "—"} · <strong>Born:</strong> {formatDate(member.birthDate, "en")}
                          </div>
                          <div>
                            <strong>Address:</strong> {member.address ?? "—"}
                          </div>
                          <div>
                            <strong>Marital status:</strong> {member.maritalStatus ?? "—"} · <strong>Spouse:</strong>{" "}
                            {member.spouseName ?? "—"}
                          </div>
                          <div>
                            <strong>Work:</strong> {member.currentJob ?? "—"} · <strong>Education:</strong>{" "}
                            {member.educationLevel ?? "—"}
                          </div>
                          <div>
                            <strong>Car:</strong> {member.hasCar ? "Yes" : "No"} · <strong>Income sufficient:</strong>{" "}
                            {member.incomeSufficient ? "Yes" : "No"}
                          </div>
                          <div>
                            <strong>Hardship:</strong> {member.hardshipNotes ?? "—"}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <strong>Volunteering:</strong>{" "}
                            {Object.entries(member.volunteerAnswers)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" · ") || "—"}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <strong>Joined:</strong> {formatDate(member.createdAt, "en")} · <strong>Last sign-in:</strong>{" "}
                            {formatDate(member.lastLoginAt, "en")}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <strong>Children:</strong> {member.sonsCount} sons · {member.daughtersCount} daughters
                            {kids > 0 ? ` · ${kids} recorded` : ""}
                          </div>
                        </div>
                      </details>
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {member.city ?? "—"}
                      <div style={{ color: "#6b7f8e", fontSize: 11.5 }}>
                        {stateName(member.country, member.stateCode, "en")}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {member.householdSize ?? 1}
                      <div style={{ color: "#6b7f8e", fontSize: 11.5 }}>{kids} children</div>
                    </td>
                    <td>
                      <StatusBadge tone={STATUS_TONE[member.status] ?? "default"}>{member.status}</StatusBadge>
                    </td>
                    <td style={{ textAlign: "end" }}>
                      {canEdit && member.status !== "pending_verification" && (
                        <form action={setMemberStatusAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={member.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={member.status === "suspended" ? "active" : "suspended"}
                          />
                          <button
                            type="submit"
                            className={`admin-btn admin-btn-sm ${member.status === "suspended" ? "" : "admin-btn-danger"}`}
                          >
                            {member.status === "suspended" ? "Activate" : "Suspend"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminPanel>

      <p className="admin-note" style={{ marginTop: 12 }}>
        Members in “incomplete” or “unverified” status cannot sign in to the members' area.
      </p>
    </>
  );
}
