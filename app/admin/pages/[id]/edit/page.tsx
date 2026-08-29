import { notFound, redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageEditor } from "@/components/admin/PageEditor";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { getAdminPageById } from "@/lib/content";
import { updatePageAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getCurrentAdminRole();
  if (!canManageStructure(role)) redirect("/admin?error=permission");

  const { id } = await params;
  const page = await getAdminPageById(id);

  if (!page) notFound();

  async function action(formData: FormData) {
    "use server";
    await updatePageAction(id, formData);
  }

  return (
    <AdminLayout title={`Sửa page: ${page.title}`}>
      <PageEditor action={action} role={role} page={page} />
    </AdminLayout>
  );
}
