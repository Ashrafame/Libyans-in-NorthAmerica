import Link from "next/link";
import { Landmark, ShieldCheck } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canRead } from "@/lib/rbac";
import { donationTotals, getSettings, listDonations } from "@/lib/repo";
import { formatDate, formatMoney } from "@/lib/format";
import { stateName } from "@/lib/geo";
import { AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";

export default async function AdminDonationsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "donations")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }


  const [totals, donations, settings] = await Promise.all([
    donationTotals(),
    listDonations({ limit: 40 }),
    getSettings(),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthTotal = donations
    .filter((donation) => donation.status === "succeeded" && new Date(donation.createdAt) >= startOfMonth)
    .reduce((sum, donation) => sum + donation.amountCents, 0);

  const byState = Object.entries(totals.byState)
    .map(([code, amount]) => ({
      code,
      amount,
      count: donations.filter((donation) => donation.stateCode === code && donation.status === "succeeded").length,
      country: donations.find((donation) => donation.stateCode === code)?.country ?? "US",
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <>
      <AdminHead
        title="Donations"
        sub="Contributions by state fund, with totals and the latest transactions."
      />

      <div className="admin-grid admin-grid-3" style={{ marginBottom: 16 }}>
        <div className="admin-metric">
          <span>Total collected</span>
          <strong>{formatMoney(totals.all, "en")}</strong>
        </div>
        <div className="admin-metric">
          <span>Successful contributions</span>
          <strong>{totals.count}</strong>
        </div>
        <div className="admin-metric">
          <span>This month</span>
          <strong>{formatMoney(monthTotal, "en")}</strong>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: 16 }}>
        <AdminPanel title="By state fund">
          {byState.length === 0 ? (
            <AdminEmpty>No donations recorded yet.</AdminEmpty>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th style={{ textAlign: "end" }}>Contributions</th>
                  <th style={{ textAlign: "end" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {byState.map((row) => (
                  <tr key={row.code}>
                    <td>
                      {stateName(row.country as "US" | "CA", row.code, "en")}
                      <span style={{ color: "#6b7f8e", fontSize: 11 }}> ({row.country})</span>
                    </td>
                    <td style={{ textAlign: "end" }}>{row.count}</td>
                    <td style={{ textAlign: "end" }}>{formatMoney(row.amount, "en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminPanel>

        <AdminPanel title="Bank account on file">
          {admin.role === "super_admin" ? (
            <>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: "#142733",
                    border: "1px solid #24485f",
                    display: "grid",
                    placeItems: "center",
                    color: "#9fd3f2",
                  }}
                >
                  <Landmark size={16} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {settings.stripeAccountHolder || "No account holder recorded"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6b7f8e" }}>
                    {settings.stripeAccountNumber ? `•••• ${settings.stripeAccountNumber.slice(-4)}` : "No account number"}
                  </div>
                </div>
              </div>
              <table className="admin-table">
                <tbody>
                  <tr>
                    <td style={{ color: "#8fa1af", width: 160 }}>Account holder</td>
                    <td>{settings.stripeAccountHolder || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#8fa1af" }}>Account number</td>
                    <td>{settings.stripeAccountNumber || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#8fa1af" }}>Routing number</td>
                    <td>{settings.stripeRoutingNumber || "—"}</td>
                  </tr>
                </tbody>
              </table>
              <Link href="/admin/appearance" className="admin-btn admin-btn-sm" style={{ marginTop: 12 }}>
                Update banking details
              </Link>
            </>
          ) : (
            <p className="admin-note">
              <ShieldCheck size={13} style={{ display: "inline", marginInlineEnd: 5 }} />
              Banking details are visible to the super admin only.
            </p>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title="Latest transactions">
        {donations.length === 0 ? (
          <AdminEmpty>No donations recorded yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Fund</th>
                <th style={{ textAlign: "end" }}>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>
                    <div style={{ fontSize: 12.5 }}>{donation.donorName}</div>
                    <div style={{ color: "#6b7f8e", fontSize: 11 }}>{donation.donorEmail}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {stateName(donation.country, donation.stateCode, "en")}
                    {donation.note ? (
                      <div style={{ color: "#6b7f8e", fontSize: 11 }}>{donation.note}</div>
                    ) : null}
                  </td>
                  <td style={{ textAlign: "end" }}>{formatMoney(donation.amountCents, "en")}</td>
                  <td>
                    <StatusBadge
                      tone={donation.status === "succeeded" ? "green" : donation.status === "pending" ? "amber" : "red"}
                    >
                      {donation.status}
                    </StatusBadge>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(donation.createdAt, "en")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </>
  );
}
