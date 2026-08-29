import { CheckCircle2, FilePenLine, RotateCcw } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { canPublish, getCurrentAdminRole } from "@/lib/auth";
import { listAdminPosts } from "@/lib/content";
import { approvePostAction, returnToDraftAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const role = await getCurrentAdminRole();
  if (!canPublish(role)) redirect("/admin?error=permission");

  const posts = await listAdminPosts();
  const pendingPosts = posts.filter((post) => post.status === "pending_review");
  const draftPosts = posts.filter((post) => post.status === "draft");

  return (
    <AdminLayout title="Duyệt bài">
      <div className="metric-grid">
        <div className="metric-card">
          <span>Chờ duyệt</span>
          <strong>{pendingPosts.length}</strong>
        </div>
        <div className="metric-card">
          <span>Nháp</span>
          <strong>{draftPosts.length}</strong>
        </div>
        <div className="metric-card">
          <span>Có thể xuất bản</span>
          <strong>{pendingPosts.filter((post) => post.title && post.content).length}</strong>
        </div>
        <div className="metric-card">
          <span>Tổng bài</span>
          <strong>{posts.length}</strong>
        </div>
      </div>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Hàng chờ duyệt</h2>
            <p>Bài viết từ AI workflow hoặc author sẽ được kiểm tra tại đây trước khi xuất bản.</p>
          </div>
          <Link className="secondary-action small-action" href="/admin/posts">
            <FilePenLine size={15} strokeWidth={1.9} />
            Mở danh sách bài
          </Link>
        </div>

        {pendingPosts.length === 0 ? (
          <div className="empty-state compact-empty">
            <CheckCircle2 size={28} strokeWidth={1.8} />
            <strong>Không có bài đang chờ duyệt.</strong>
            <span>Khi AI hoặc author gửi bài, nội dung sẽ xuất hiện ở đây.</span>
          </div>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row review-row admin-table-head">
              <span>Bài viết</span>
              <span>Chuyên mục</span>
              <span>Trạng thái</span>
              <span>SEO</span>
              <span>Thao tác</span>
            </div>
            {pendingPosts.map((post) => (
              <div className="admin-table-row review-row" key={post.id}>
                <div>
                  <Link className="table-title-link" href={`/admin/posts/${post.id}/edit`}>
                    {post.title}
                  </Link>
                  <p className="table-note">{post.excerpt || "Chưa có mô tả ngắn."}</p>
                </div>
                <span>{post.category.name}</span>
                <StatusBadge status={post.status} />
                <span className={post.seoTitle && post.metaDescription ? "permission-on" : "permission-off"}>
                  {post.seoTitle && post.metaDescription ? "Đủ SEO" : "Thiếu SEO"}
                </span>
                <div className="row-actions">
                  <form action={approvePostAction.bind(null, post.id)}>
                    <button className="primary-button small-action" type="submit">
                      <CheckCircle2 size={15} strokeWidth={1.9} />
                      Xuất bản
                    </button>
                  </form>
                  <form action={returnToDraftAction.bind(null, post.id)}>
                    <button className="secondary-action small-action" type="submit">
                      <RotateCcw size={15} strokeWidth={1.9} />
                      Trả nháp
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
