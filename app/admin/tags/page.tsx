import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { listAdminPosts, listTags } from "@/lib/content";
import { deleteTagAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");

  const [tags, posts] = await Promise.all([listTags(), listAdminPosts()]);

  return (
    <AdminLayout title="Quản lý tags">
      <div className="admin-actions">
        <Link className="primary-button" href="/admin/tags/new">
          Tạo tag
        </Link>
      </div>

      <div className="admin-table">
        <div className="admin-table-row tag-row admin-table-head">
          <span>Tên</span>
          <span>Slug</span>
          <span>Số bài</span>
          <span>Thao tác</span>
        </div>
        {tags.map((tag) => (
          <div className="admin-table-row tag-row" key={tag.id}>
            <strong>{tag.name}</strong>
            <span>{tag.slug}</span>
            <span>{posts.filter((post) => post.tags.includes(tag.name)).length}</span>
            <div className="row-actions">
              <Link className="secondary-action small-action" href={`/admin/tags/${tag.id}/edit`}>
                Sửa
              </Link>
              <form action={deleteTagAction.bind(null, tag.id)}>
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
