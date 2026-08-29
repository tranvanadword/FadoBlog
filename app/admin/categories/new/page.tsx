import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { createCategoryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");

  return (
    <AdminLayout title="Tạo chuyên mục mới">
      <CategoryEditor action={createCategoryAction} />
    </AdminLayout>
  );
}
