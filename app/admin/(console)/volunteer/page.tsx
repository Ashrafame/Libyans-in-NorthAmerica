import { Plus } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listVolunteerQuestions } from "@/lib/repo";
import { createVolunteerQuestionAction } from "@/lib/actions/admin";
import { AField, ASelect, ATextarea, AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";

export default async function AdminVolunteerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "volunteer")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const saved = Boolean(query.saved);
  const error = typeof query.error === "string" ? query.error : undefined;
  const canEdit = canWrite(admin.role, "volunteer");

  const questions = await listVolunteerQuestions(true);

  return (
    <>
      <AdminHead
        title="Volunteer questions"
        sub="Add or change the questions every member answers when they join. Existing answers are preserved."
      />

      {saved && <AdminNotice tone="ok">Question saved.</AdminNotice>}
      {error === "options" && <AdminNotice tone="error">A single-choice question needs at least two options.</AdminNotice>}
      {error === "required" && <AdminNotice tone="error">Both language versions of the question are required.</AdminNotice>}

      {canEdit && (
        <AdminPanel title="New question" style={{ marginBottom: 20 }}>
          <form action={createVolunteerQuestionAction}>
            <div className="admin-grid admin-grid-2">
              <AField label="Question (English)" name="promptEn" required />
              <AField label="Question (Arabic)" name="promptAr" required dir="rtl" />
              <ASelect
                label="Answer type"
                name="type"
                defaultValue="single_select"
                options={[
                  { value: "boolean", label: "Yes / No" },
                  { value: "single_select", label: "Single choice" },
                ]}
              />
              <AField label="Sort order" name="sortOrder" type="number" defaultValue={10} />
              <ATextarea
                label="Options (one per line, English | Arabic)"
                name="options"
                rows={4}
                span
                placeholder={"I can travel anywhere | يمكنني السفر في أي وقت\nI can help remotely | يمكنني المساعدة عن بعد"}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Plus size={14} /> Add question
              </button>
            </div>
          </form>
        </AdminPanel>
      )}

      <AdminPanel title={`Questions (${questions.length})`}>
        {questions.length === 0 ? (
          <AdminEmpty>No questions yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Type</th>
                <th>Options</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td style={{ maxWidth: 380 }}>
                    <div style={{ fontSize: 12.5 }}>{question.promptEn}</div>
                    <div style={{ fontSize: 11.5, color: "#8fa1af", marginTop: 3 }} dir="rtl">
                      {question.promptAr}
                    </div>
                  </td>
                  <td>
                    <StatusBadge>{question.type === "boolean" ? "Yes / No" : "Single choice"}</StatusBadge>
                  </td>
                  <td style={{ fontSize: 11.5, color: "#9fb2c0" }}>
                    {question.options.map((option) => option.labelEn).join(" · ")}
                  </td>
                  <td>
                    <StatusBadge tone={question.active ? "green" : "default"}>
                      {question.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </>
  );
}
