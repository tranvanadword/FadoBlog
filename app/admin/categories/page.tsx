import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { listCategories } from "@/lib/content";
import { deleteCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");

  const categories = await listCategories();

  return (
    <AdminLayout title="Quản lý chuyên mục">
      <div className="admin-actions">
        <Link className="primary-button" href="/admin/categories/new">
          Tạo chuyên mục
        </Link>
      </div>

      <div className="admin-table">
        <div className="admin-table-row category-row admin-table-head">
          <span>Tên</span>
          <span>Slug</span>
          <span>Mô tả</span>
          <span>Thao tác</span>
        </div>
        {categories.map((category) => (
          <div className="admin-table-row category-row" key={category.id}>
            <strong>{category.name}</strong>
            <span>{category.slug}</span>
            <span>{category.description}</span>
            <div className="row-actions">
              <Link className="secondary-action small-action" href={`/admin/categories/${category.id}/edit`}>
                Sửa
              </Link>
              <form action={deleteCategoryAction.bind(null, category.id)}>
                <button className="danger-button" type="submit">
                  Xóa
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
