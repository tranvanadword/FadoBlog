import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TagEditor } from "@/components/admin/TagEditor";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { createTagAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewTagPage() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");

  return (
    <AdminLayout title="Tạo tag mới">
      <TagEditor action={createTagAction} />
    </AdminLayout>
  );
}
