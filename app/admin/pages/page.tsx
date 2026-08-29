import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { canDeleteContent, canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { listPages } from "@/lib/content";
import { deletePageAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canManageStructure(role)) redirect("/admin?error=permission");

  const [pages, params] = await Promise.all([listPages(), searchParams]);
  const allowDelete = canDeleteContent(role);

  return (
    <AdminLayout title="Quản lý page tĩnh">
      {params.error === "permission" ? <p className="login-error">Vai trò hiện tại không có quyền xóa page.</p> : null}
      <div className="admin-actions">
        <Link className="primary-button" href="/admin/pages/new">
          Tạo page
        </Link>
      </div>

      <div className="admin-table">
        <div className="admin-table-row page-row admin-table-head">
          <span>Tiêu đề</span>
          <span>Slug</span>
          <span>Trạng thái</span>
          <span>Cập nhật</span>
          <span>Thao tác</span>
        </div>
        {pages.map((page) => (
          <div className="admin-table-row page-row" key={page.id}>
            <strong>{page.title}</strong>
            <span>{page.slug}</span>
            <StatusBadge status={page.status} />
            <span>{page.updatedAt}</span>
            <div className="row-actions">
              <Link className="secondary-action small-action" href={`/admin/pages/${page.id}/edit`}>
                Sửa
              </Link>
              {allowDelete ? (
                <form action={deletePageAction.bind(null, page.id)}>
                  <button className="danger-button" type="submit">
                    Xóa
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
