import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { AdminHead, AdminNotice } from "@/components/admin/ui";
import { PostEditor } from "@/components/admin/post-editor";

export default async function NewPostPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "content")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  if (!canWrite(admin.role, "content")) {
    return <AdminNotice tone="error">Your role has read-only access to content.</AdminNotice>;
  }

  return (
    <>
      <AdminHead
        title="New story"
        sub="Write in both languages. Arabic readers should see the same story, not a translation note."
        actions={
          <Link href="/admin/content" className="admin-btn">
            Back to list
          </Link>
        }
      />
      <PostEditor post={null} />
    </>
  );
}
