import { UserPlus } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listCommittee } from "@/lib/repo";
import { createCommitteeAction } from "@/lib/actions/admin";
import { stateName } from "@/lib/geo";
import { AField, ATextarea, AdminHead, AdminNotice, AdminPanel, AdminEmpty } from "@/components/admin/ui";
import { AdminGeoPicker } from "@/components/admin/geo-picker";

export default async function AdminCommitteePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "committee")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const saved = Boolean(query.saved);
  const error = query.error === "required";
  const canEdit = canWrite(admin.role, "committee");

  const committee = await listCommittee();
  const groups = committee.reduce<Record<string, typeof committee>>((acc, person) => {
    const key = `${person.country}:${person.stateCode}`;
    acc[key] = acc[key] ?? [];
    acc[key].push(person);
    return acc;
  }, {});

  return (
    <>
      <AdminHead
        title="Fund committees"
        sub="The names published to members for each state fund, together with their roles."
      />

      {saved && <AdminNotice tone="ok">Committee member added.</AdminNotice>}
      {error && <AdminNotice tone="error">Country, state, and name are required.</AdminNotice>}

      {canEdit && (
        <AdminPanel title="Add committee member" style={{ marginBottom: 20 }}>
          <form action={createCommitteeAction}>
            <div className="admin-grid admin-grid-3" style={{ marginBottom: 12 }}>
              <AdminGeoPicker showCity={false} />
              <AField label="Name" name="name" required />
              <AField label="Role (English)" name="roleEn" defaultValue="Committee member" />
              <AField label="Role (Arabic)" name="roleAr" defaultValue="عضو لجنة" />
              <AField label="Sort order" name="sortOrder" type="number" defaultValue={10} />
              <ATextarea label="Short bio" name="bio" rows={2} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <UserPlus size={14} /> Add member
              </button>
            </div>
          </form>
        </AdminPanel>
      )}

      {Object.keys(groups).length === 0 ? (
        <AdminPanel>
          <AdminEmpty>No committee members yet.</AdminEmpty>
        </AdminPanel>
      ) : (
        <div className="admin-grid admin-grid-2">
          {Object.entries(groups).map(([key, people]) => {
            const [country, stateCode] = key.split(":");
            return (
              <AdminPanel
                key={key}
                title={`${stateName(country as "US" | "CA", stateCode, "en")} · ${country}`}
              >
                <table className="admin-table">
                  <tbody>
                    {people.map((person) => (
                      <tr key={person.id}>
                        <td>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{person.name}</div>
                          <div style={{ fontSize: 11, color: "#6b7f8e", marginTop: 2 }}>
                            {person.roleEn} · {person.roleAr}
                          </div>
                          {person.bio && (
                            <div style={{ fontSize: 11.5, color: "#8fa1af", marginTop: 4 }}>{person.bio}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminPanel>
            );
          })}
        </div>
      )}
    </>
  );
}
