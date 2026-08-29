import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { canDeleteContent, getCurrentAdminRole } from "@/lib/auth";
import { listAdminPosts } from "@/lib/content";
import { deletePostAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [posts, params] = await Promise.all([listAdminPosts(), searchParams]);
  const role = await getCurrentAdminRole();
  const allowDelete = canDeleteContent(role);

  return (
    <AdminLayout title="Quản lý bài viết">
      {params.error === "permission" ? <p className="login-error">Vai trò hiện tại không có quyền xóa nội dung.</p> : null}
      <div className="admin-actions">
        <Link className="primary-button" href="/admin/posts/new">
          Tạo bài mới
        </Link>
      </div>
      <div className="admin-table">
        <div className="admin-table-row admin-table-head">
          <span>Tiêu đề</span>
          <span>Chuyên mục</span>
          <span>Trạng thái</span>
          <span>Ngày đăng</span>
          <span>Thao tác</span>
        </div>
        {posts.map((post) => (
          <div className="admin-table-row" key={post.id}>
            <Link href={"/admin/posts/" + post.id + "/edit"}>{post.title}</Link>
            <span>{post.category.name}</span>
            <StatusBadge status={post.status} />
            <span>{post.publishedAt}</span>
            {allowDelete ? (
              <form action={deletePostAction.bind(null, post.id)}>
                <button className="danger-button" type="submit">
                  Xóa
                </button>
              </form>
            ) : (
              <span className="muted-text">Không có quyền</span>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
