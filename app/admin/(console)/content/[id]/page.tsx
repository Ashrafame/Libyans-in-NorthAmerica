import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { getPostById } from "@/lib/repo";
import { AdminHead, AdminNotice } from "@/components/admin/ui";
import { PostEditor } from "@/components/admin/post-editor";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "content")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const { id } = await params;
  const query = await searchParams;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <>
      <AdminHead
        title="Edit story"
        sub={post.slug}
        actions={
          <>
            <Link href="/admin/content" className="admin-btn">
              Back to list
            </Link>
            {post.status === "published" && (
              <Link href={`/en/news/${post.slug}`} target="_blank" className="admin-btn">
                <ExternalLink size={13} /> View live
              </Link>
            )}
          </>
        }
      />
      {Boolean(query.saved) && <AdminNotice tone="ok">Story saved.</AdminNotice>}
      {!canWrite(admin.role, "content") && (
        <AdminNotice tone="info">Your role has read-only access; saving is disabled.</AdminNotice>
      )}
      <PostEditor post={post} />
    </>
  );
}
