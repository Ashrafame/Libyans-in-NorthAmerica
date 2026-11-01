import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Post, PostKind } from "@/lib/types";
import { deletePostAction, savePostAction } from "@/lib/actions/admin";
import { AField, ASelect, ATextarea, AdminPanel, StatusBadge } from "@/components/admin/ui";
import { AdminGeoPicker } from "@/components/admin/geo-picker";
import { formatDate } from "@/lib/format";

const KINDS: { value: PostKind; label: string }[] = [
  { value: "news", label: "Community news" },
  { value: "guide", label: "Guide / rules" },
  { value: "jobs", label: "Jobs" },
  { value: "success", label: "Success story" },
  { value: "idea", label: "Idea" },
];

export function PostEditor({ post, saved }: { post: Post | null; saved?: boolean }) {
  const published = post?.status === "published";

  return (
    <>
      <form action={savePostAction}>
        {post && <input type="hidden" name="id" value={post.id} />}

        <AdminPanel style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <AField label="Title (English)" name="titleEn" defaultValue={post?.titleEn} required span />
            <AField label="Title (Arabic)" name="titleAr" defaultValue={post?.titleAr} required span dir="rtl" />
            <ATextarea label="Excerpt (English)" name="excerptEn" defaultValue={post?.excerptEn} rows={2} />
            <ATextarea label="Excerpt (Arabic)" name="excerptAr" defaultValue={post?.excerptAr} rows={2} />
            <ATextarea label="Body (English)" name="bodyEn" defaultValue={post?.bodyEn} rows={10} />
            <ATextarea label="Body (Arabic)" name="bodyAr" defaultValue={post?.bodyAr} rows={10} />
          </div>
        </AdminPanel>

        <AdminPanel title="Classification" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <ASelect label="Topic" name="kind" defaultValue={post?.kind ?? "news"} options={KINDS} />
            <AField label="Author" name="authorName" defaultValue={post?.authorName ?? "Community Desk"} />
            <AdminGeoPicker defaultCountry={post?.country} defaultState={post?.stateCode} defaultCity={post?.city} />
            <AField
              label="Cover image URL (optional)"
              name="coverImage"
              defaultValue={post?.coverImage}
              span
              hint="Leave empty to use the typographic fallback cover."
            />
            <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#cfdae3" }}>
                <input type="checkbox" name="featured" defaultChecked={post?.featured} />
                Feature on the home page
              </label>
            </div>
          </div>
        </AdminPanel>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {post ? (
              <>
                <StatusBadge tone={published ? "green" : "amber"}>{post.status}</StatusBadge>
                <span className="admin-note">
                  Created {formatDate(post.createdAt, "en")}
                  {post.publishedAt ? ` · published ${formatDate(post.publishedAt, "en")}` : ""}
                </span>
              </>
            ) : (
              <span className="admin-note">New story — save as draft or publish.</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin/content" className="admin-btn">
              Cancel
            </Link>
            <button type="submit" className="admin-btn">
              Save draft
            </button>
            <button type="submit" name="publish" value="true" className="admin-btn admin-btn-primary">
              {published ? "Update & keep published" : "Publish now"}
            </button>
          </div>
        </div>
      </form>

      {post && (
        <form action={deletePostAction}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">
            <Trash2 size={13} /> Delete this story permanently
          </button>
        </form>
      )}
    </>
  );
}
