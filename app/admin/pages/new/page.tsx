import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageEditor } from "@/components/admin/PageEditor";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { createPageAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  const role = await getCurrentAdminRole();
  if (!canManageStructure(role)) redirect("/admin?error=permission");

  return (
    <AdminLayout title="Tạo page mới">
      <PageEditor action={createPageAction} role={role} />
    </AdminLayout>
  );
}
