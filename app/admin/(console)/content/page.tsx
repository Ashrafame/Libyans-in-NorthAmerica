import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listPosts } from "@/lib/repo";
import { formatDate } from "@/lib/format";
import { AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";

const KIND_LABEL: Record<string, string> = {
  news: "News",
  guide: "Guide",
  jobs: "Jobs",
  success: "Success",
  idea: "Idea",
};

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "content")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const deleted = Boolean(query.deleted);
  const saved = Boolean(query.saved);
  const error = query.error === "required";

  const posts = await listPosts({ includeDrafts: true });
  const canEdit = canWrite(admin.role, "content");

  return (
    <>
      <AdminHead
        title="News & content"
        sub="Publish community news, guides, job lists, and success stories in both languages."
        actions={
          canEdit ? (
            <Link href="/admin/content/new" className="admin-btn admin-btn-primary">
              <Plus size={14} /> New story
            </Link>
          ) : undefined
        }
      />

      {saved && <AdminNotice tone="ok">Story saved.</AdminNotice>}
      {deleted && <AdminNotice tone="ok">Story deleted.</AdminNotice>}
      {error && <AdminNotice tone="error">Title in both languages is required.</AdminNotice>}

      <AdminPanel>
        {posts.length === 0 ? (
          <AdminEmpty>No stories yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Published</th>
                <th style={{ textAlign: "end" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td style={{ maxWidth: 420 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {post.featured && <Star size={12} style={{ color: "#e0a74a" }} />}
                      <span style={{ fontWeight: 500 }}>{post.titleEn}</span>
                    </div>
                    <div style={{ color: "#6b7f8e", fontSize: 11.5, marginTop: 3 }} dir="rtl">
                      {post.titleAr}
                    </div>
                  </td>
                  <td>
                    <StatusBadge>{KIND_LABEL[post.kind] ?? post.kind}</StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={post.status === "published" ? "green" : "amber"}>{post.status}</StatusBadge>
                  </td>
                  <td style={{ color: "#8fa1af", fontSize: 12 }}>
                    {post.publishedAt ? formatDate(post.publishedAt, "en") : "—"}
                  </td>
                  <td style={{ textAlign: "end" }}>
                    <Link href={`/admin/content/${post.id}`} className="admin-btn admin-btn-sm">
                      {canEdit ? "Edit" : "View"}
                    </Link>
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
