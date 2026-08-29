import { notFound, redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { getCategoryById } from "@/lib/content";
import { updateCategoryAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");

  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateCategoryAction(id, formData);
  }

  return (
    <AdminLayout title={`Sửa chuyên mục: ${category.name}`}>
      <CategoryEditor action={action} category={category} />
    </AdminLayout>
  );
}
