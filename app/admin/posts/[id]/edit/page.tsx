import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PostEditor } from "@/components/admin/PostEditor";
import { PostRevisionList } from "@/components/admin/PostRevisionList";
import { getCurrentAdminRole } from "@/lib/auth";
import { getAdminPostById, listCategories, listMedia, listPostRevisions, listTags } from "@/lib/content";
import { restorePostRevisionAction, updatePostAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, media, tags, post, revisions] = await Promise.all([
    listCategories(),
    listMedia(),
    listTags(),
    getAdminPostById(id),
    listPostRevisions(id),
  ]);
  const role = await getCurrentAdminRole();

  if (!post) notFound();

  async function action(formData: FormData) {
    "use server";
    await updatePostAction(id, formData);
  }

  async function restoreAction(formData: FormData) {
    "use server";
    await restorePostRevisionAction(id, String(formData.get("revisionId") ?? ""));
  }

  return (
    <AdminLayout title={`Sửa bài viết: ${post.title}`}>
      <PostEditor action={action} categories={categories} media={media} tags={tags} role={role} post={post} />
      <PostRevisionList revisions={revisions} restoreAction={restoreAction} />
    </AdminLayout>
  );
}
