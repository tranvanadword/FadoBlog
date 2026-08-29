import { notFound, redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TagEditor } from "@/components/admin/TagEditor";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { getTagById } from "@/lib/content";
import { updateTagAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditTagPage({ params }: { params: Promise<{ id: string }> }) {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");

  const { id } = await params;
  const tag = await getTagById(id);

  if (!tag) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateTagAction(id, formData);
  }

  return (
    <AdminLayout title={`Sửa tag: ${tag.name}`}>
      <TagEditor action={action} tag={tag} />
    </AdminLayout>
  );
}
