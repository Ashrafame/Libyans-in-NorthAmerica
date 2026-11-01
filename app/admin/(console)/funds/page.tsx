import Link from "next/link";
import { Send } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listFundReports } from "@/lib/repo";
import { formatDate, formatMoney } from "@/lib/format";
import { stateName } from "@/lib/geo";
import { createFundReportAction } from "@/lib/actions/admin";
import { AField, ASelect, ATextarea, AdminHead, AdminNotice, AdminPanel, AdminEmpty } from "@/components/admin/ui";
import { AdminGeoPicker } from "@/components/admin/geo-picker";

export default async function AdminFundsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "funds")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const published = typeof query.published === "string" ? query.published : undefined;
  const error = query.error === "required";
  const canEdit = canWrite(admin.role, "funds");

  const reports = await listFundReports();

  return (
    <>
      <AdminHead
        title="Fund reports"
        sub="Publish a quarterly report. Every member of that state receives it in their inbox automatically."
      />

      {published && <AdminNotice tone="ok">Report published and delivered to {published} members.</AdminNotice>}
      {error && <AdminNotice tone="error">Choose a country and state, and fill both titles.</AdminNotice>}

      {canEdit && (
        <AdminPanel title="New report" style={{ marginBottom: 20 }}>
          <form action={createFundReportAction}>
            <div className="admin-grid admin-grid-3" style={{ marginBottom: 14 }}>
              <AdminGeoPicker showCity={false} />
              <AField label="Collected (cents)" name="amountCents" type="number" defaultValue={0} />
              <AField label="Period label" name="periodLabel" defaultValue="2026 Q4" />
              <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="titleEn">Report title (English)</label>
                <input id="titleEn" name="titleEn" className="admin-input" required />
              </div>
              <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="titleAr">Report title (Arabic)</label>
                <input id="titleAr" name="titleAr" className="admin-input" required dir="rtl" />
              </div>
              <ATextarea label="Report (English)" name="bodyEn" rows={6} />
              <ATextarea label="Report (Arabic)" name="bodyAr" rows={6} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Send size={14} /> Publish and notify members
              </button>
            </div>
          </form>
        </AdminPanel>
      )}

      <AdminPanel title={`Published reports (${reports.length})`}>
        {reports.length === 0 ? (
          <AdminEmpty>No reports published yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Fund</th>
                <th>Period</th>
                <th style={{ textAlign: "end" }}>Collected</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td style={{ maxWidth: 400 }}>
                    <div style={{ fontWeight: 500 }}>{report.titleEn}</div>
                    <div style={{ color: "#6b7f8e", fontSize: 11.5, marginTop: 2 }} dir="rtl">
                      {report.titleAr}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {stateName(report.country, report.stateCode, "en")}
                    <div style={{ color: "#6b7f8e", fontSize: 11 }}>{report.country}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{report.periodLabel}</td>
                  <td style={{ textAlign: "end" }}>{formatMoney(report.amountCents, "en")}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(report.publishedAt, "en")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>

      <p className="admin-note" style={{ marginTop: 12 }}>
        Reports are visible to members of the matching state on the <Link href="/en/members/donations">community fund</Link>{" "}
        page and in their inbox.
      </p>
    </>
  );
}
