import Link from "next/link";
import { ArrowUpRight, CalendarRange, FileText, Users, Wallet } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canRead } from "@/lib/rbac";
import {
  communityStats,
  donationTotals,
  listAudit,
  listEvents,
  listMembers,
  listPosts,
} from "@/lib/repo";
import { formatDate, formatMoney } from "@/lib/format";
import { stateName } from "@/lib/geo";
import { AdminHead, AdminNotice, AdminPanel, StatusBadge } from "@/components/admin/ui";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const query = await searchParams;
  const denied = typeof query.denied === "string" ? query.denied : undefined;

  const [members, posts, events, totals, stats, audit] = await Promise.all([
    listMembers(),
    listPosts({ includeDrafts: true }),
    listEvents(),
    donationTotals(),
    communityStats(),
    canRead(admin.role, "audit") ? listAudit(8) : Promise.resolve([]),
  ]);

  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending_verification" || m.status === "onboarding");
  const now = Date.now();
  const ticker = events.find((event) => event.tickerEnabled && new Date(event.tickerUntil).getTime() > now);

  const byState = Object.entries(
    active.reduce<Record<string, number>>((acc, member) => {
      const key = `${member.country}:${member.stateCode}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <AdminHead
        title="Community overview"
        sub="A live view of the community, its content, and its funds."
        actions={
          <>
            <Link href="/admin/content/new" className="admin-btn">
              <FileText size={14} /> New story
            </Link>
            <Link href="/admin/events" className="admin-btn admin-btn-primary">
              <CalendarRange size={14} /> New event
            </Link>
          </>
        }
      />

      {denied && <AdminNotice tone="error">Your role does not have access to the “{denied}” section.</AdminNotice>}

      <div className="admin-grid admin-grid-4" style={{ marginBottom: 16 }}>
        <div className="admin-metric">
          <span>Active families</span>
          <strong>{active.length}</strong>
        </div>
        <div className="admin-metric">
          <span>Awaiting verification</span>
          <strong>{pending.length}</strong>
        </div>
        <div className="admin-metric">
          <span>Published stories</span>
          <strong>{posts.filter((post) => post.status === "published").length}</strong>
        </div>
        <div className="admin-metric">
          <span>Funds collected</span>
          <strong>{formatMoney(totals.all, "en")}</strong>
        </div>
      </div>

      <div className="admin-grid admin-grid-2">
        <AdminPanel title="Live ticker">
          {ticker ? (
            <>
              <StatusBadge tone="green">Showing now</StatusBadge>
              <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>{ticker.tickerTextEn}</p>
              <p className="admin-note" style={{ marginTop: 8 }}>
                Ends {formatDate(ticker.tickerUntil, "en")} · background{" "}
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: ticker.tickerBgColor }} />{" "}
                {ticker.tickerBgColor}
              </p>
            </>
          ) : (
            <>
              <StatusBadge>No active notice</StatusBadge>
              <p className="admin-note" style={{ marginTop: 12 }}>
                Create an event with the scrolling notice enabled, or extend the ticker days on an existing one.
              </p>
            </>
          )}
        </AdminPanel>

        <AdminPanel title="Community totals">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "States & provinces", value: stats.states, icon: <Users size={14} /> },
              { label: "Events scheduled", value: stats.events, icon: <CalendarRange size={14} /> },
              { label: "Successful donations", value: totals.count, icon: <Wallet size={14} /> },
              { label: "Stories in library", value: posts.length, icon: <FileText size={14} /> },
            ].map((item) => (
              <div key={item.label} style={{ padding: 12, border: "1px solid #26323c", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#8fa1af", display: "flex", alignItems: "center", gap: 6 }}>
                  {item.icon}
                  {item.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginTop: 16 }}>
        <AdminPanel title="Families by state">
          {byState.length === 0 ? (
            <p className="admin-note">No verified families yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>State / Province</th>
                  <th style={{ textAlign: "end" }}>Families</th>
                </tr>
              </thead>
              <tbody>
                {byState.map(([key, count]) => {
                  const [country, code] = key.split(":");
                  return (
                    <tr key={key}>
                      <td>
                        {stateName(country as "US" | "CA", code, "en")}{" "}
                        <span style={{ color: "#6b7f8e", fontSize: 11 }}>({country})</span>
                      </td>
                      <td style={{ textAlign: "end" }}>{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </AdminPanel>

        <AdminPanel
          title={canRead(admin.role, "audit") ? "Recent activity" : "Recent members"}
          actions={
            canRead(admin.role, "audit") ? (
              <Link href="/admin/audit" className="admin-btn admin-btn-sm">
                Open log <ArrowUpRight size={12} />
              </Link>
            ) : undefined
          }
        >
          {canRead(admin.role, "audit") ? (
            audit.length === 0 ? (
              <p className="admin-note">No recorded activity yet.</p>
            ) : (
              <table className="admin-table">
                <tbody>
                  {audit.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div style={{ fontSize: 12.5 }}>{entry.summary}</div>
                        <div style={{ fontSize: 11, color: "#6b7f8e", marginTop: 3 }}>
                          {entry.actorName} · {formatDate(entry.createdAt, "en", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ textAlign: "end" }}>
                        <StatusBadge>{entry.action}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : members.length === 0 ? (
            <p className="admin-note">No members yet.</p>
          ) : (
            <table className="admin-table">
              <tbody>
                {members.slice(0, 6).map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontSize: 12.5 }}>
                        {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.email}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7f8e", marginTop: 3 }}>
                        {member.city}, {member.stateCode}
                      </div>
                    </td>
                    <td style={{ textAlign: "end" }}>
                      <StatusBadge tone={member.status === "active" ? "green" : "amber"}>{member.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminPanel>
      </div>
    </>
  );
}
