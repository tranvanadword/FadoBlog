import { AdminLayout } from "@/components/admin/AdminLayout";
import { PostEditor } from "@/components/admin/PostEditor";
import { getCurrentAdminRole } from "@/lib/auth";
import { listCategories, listMedia, listTags } from "@/lib/content";
import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [categories, media, tags] = await Promise.all([listCategories(), listMedia(), listTags()]);
  const role = await getCurrentAdminRole();

  return (
    <AdminLayout title="Tạo bài viết mới">
      <PostEditor action={createPostAction} categories={categories} media={media} tags={tags} role={role} />
    </AdminLayout>
  );
}
