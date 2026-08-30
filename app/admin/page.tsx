import Link from "next/link";
import { AlertTriangle, Bot, CheckCircle2, ClipboardList, FileText, Gauge, Rocket, Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  canDeleteContent,
  canManageMedia,
  canManageSettings,
  canManageStructure,
  canPublish,
  canUseAiWorkflow,
  getCurrentAdminRole,
  getRoleLabel,
} from "@/lib/auth";
import { getSiteSettings, listAiJobs, listAiWorkflows, listAdminPosts, listMedia, listPages, listTags } from "@/lib/content";
import { getDatabaseStatus } from "@/lib/db";
import type { PostStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusOrder: PostStatus[] = ["published", "pending_review", "draft", "scheduled", "archived"];
const statusLabels: Record<PostStatus, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  scheduled: "Đã lên lịch",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

function countByStatus(posts: { status: PostStatus }[]) {
  return statusOrder.map((status) => ({
    status,
    label: statusLabels[status],
    count: posts.filter((post) => post.status === status).length,
  }));
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [posts, pages, tags, media, workflows, jobs, settings, params] = await Promise.all([
    listAdminPosts(),
    listPages(),
    listTags(),
    listMedia(),
    listAiWorkflows(),
    listAiJobs(),
    getSiteSettings(),
    searchParams,
  ]);
  const db = getDatabaseStatus();
  const role = await getCurrentAdminRole();
  const published = posts.filter((post) => post.status === "published").length;
  const pendingPosts = posts.filter((post) => post.status === "pending_review");
  const draftPosts = posts.filter((post) => post.status === "draft");
  const activeWorkflows = workflows.filter((workflow) => workflow.active);
  const failedJobs = jobs.filter((job) => job.status === "failed");
  const missingSeoPosts = posts.filter((post) => !post.seoTitle || !post.metaDescription).slice(0, 5);
  const recentJobs = jobs.slice(0, 5);
  const warnings = [
    !db.connected ? "Database chưa kết nối, hiện đang dùng dữ liệu local." : "",
    !process.env.OPENAI_API_KEY ? "OpenAI API chưa bật, AI workflow đang dùng Mock AI local." : "",
    settings.publicUrl.includes("localhost") ? "Domain public vẫn đang là localhost." : "",
    activeWorkflows.length === 0 ? "Chưa có workflow AI nào đang bật." : "",
    failedJobs.length > 0 ? `${failedJobs.length} AI job gần đây bị lỗi.` : "",
  ].filter(Boolean);

  return (
    <AdminLayout title="Dashboard">
      {params.error === "permission" ? <p className="login-error">Vai trò hiện tại chưa có quyền mở khu vực này.</p> : null}

      <div className="metric-grid">
        <div className="metric-card">
          <span>Tổng bài</span>
          <span className="metric-icon">
            <FileText size={20} strokeWidth={1.9} />
          </span>
          <strong>{posts.length}</strong>
        </div>
        <div className="metric-card">
          <span>Đã đăng</span>
          <span className="metric-icon green">
            <CheckCircle2 size={20} strokeWidth={1.9} />
          </span>
          <strong>{published}</strong>
        </div>
        <div className="metric-card">
          <span>Chờ duyệt</span>
          <span className="metric-icon yellow">
            <ClipboardList size={20} strokeWidth={1.9} />
          </span>
          <strong>{pendingPosts.length}</strong>
        </div>
        <div className="metric-card">
          <span>Workflow bật</span>
          <span className="metric-icon cyan">
            <Bot size={20} strokeWidth={1.9} />
          </span>
          <strong>{activeWorkflows.length}</strong>
        </div>
      </div>

      <section className="dashboard-grid">
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Việc cần xử lý</h2>
              <p>Bài chờ duyệt và draft mới nhất.</p>
            </div>
            <span className="admin-panel-icon yellow">
              <ClipboardList size={21} strokeWidth={1.9} />
            </span>
            <Link className="secondary-action small-action" href="/admin/posts">
              Mở bài viết
            </Link>
          </div>
          {[...pendingPosts, ...draftPosts].slice(0, 5).length === 0 ? (
            <p className="page-intro">Không có bài nào cần xử lý ngay.</p>
          ) : (
            <div className="mini-list">
              {[...pendingPosts, ...draftPosts].slice(0, 5).map((post) => (
                <Link key={post.id} href={`/admin/posts/${post.id}/edit`} className="mini-list-row">
                  <span>{post.title}</span>
                  <StatusBadge status={post.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Cảnh báo</h2>
              <p>Các điểm nên hoàn thiện trước khi production.</p>
            </div>
            <span className="admin-panel-icon red">
              <AlertTriangle size={21} strokeWidth={1.9} />
            </span>
          </div>
          {warnings.length === 0 ? (
            <p className="success-message">Cấu hình hiện tại ổn.</p>
          ) : (
            <div className="warning-list">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Tình trạng nội dung</h2>
            <p>Phân bố bài viết theo trạng thái.</p>
          </div>
            <span className="admin-panel-icon">
              <Gauge size={21} strokeWidth={1.9} />
            </span>
        </div>
        <div className="status-overview">
          {countByStatus(posts).map((item) => (
            <div key={item.status} className="status-overview-item">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>AI jobs gần đây</h2>
              <p>Theo dõi các lần sinh bài gần nhất.</p>
            </div>
            <span className="admin-panel-icon cyan">
              <Sparkles size={21} strokeWidth={1.9} />
            </span>
            {canUseAiWorkflow(role) ? (
              <Link className="secondary-action small-action" href="/admin/ai-workflows">
                Mở workflow
              </Link>
            ) : null}
          </div>
          {recentJobs.length === 0 ? (
            <p className="page-intro">Chưa có AI job nào.</p>
          ) : (
            <div className="mini-list">
              {recentJobs.map((job) => (
                <div key={job.id} className="mini-list-row">
                  <span>{job.topic}</span>
                  <span className={job.status === "failed" ? "status-badge status-archived" : "status-badge status-published"}>
                    {job.status === "failed" ? "Lỗi" : "Đã tạo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Workflow đang bật</h2>
              <p>Những luồng có thể chạy thủ công hoặc theo lịch.</p>
            </div>
            <span className="admin-panel-icon green">
              <Rocket size={21} strokeWidth={1.9} />
            </span>
          </div>
          {activeWorkflows.length === 0 ? (
            <p className="page-intro">Chưa có workflow nào đang bật.</p>
          ) : (
            <div className="mini-list">
              {activeWorkflows.slice(0, 5).map((workflow) => (
                <div key={workflow.id} className="mini-list-row">
                  <span>{workflow.name}</span>
                  <span className="muted-text">{workflow.scheduleRule}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="admin-panel">
          <h2>Vai trò hiện tại</h2>
          <p className="page-intro">
            Tài khoản đang đăng nhập với quyền <strong>{getRoleLabel(role)}</strong>. Admin có thể đổi vai trò trong mục Users.
          </p>
          <div className="permission-grid">
            <span className={canPublish(role) ? "permission-on" : "permission-off"}>Đăng bài trực tiếp</span>
            <span className={canManageStructure(role) ? "permission-on" : "permission-off"}>Quản lý chuyên mục/page</span>
            <span className={canManageMedia(role) ? "permission-on" : "permission-off"}>Upload media</span>
            <span className={canDeleteContent(role) ? "permission-on" : "permission-off"}>Xóa nội dung</span>
            <span className={canUseAiWorkflow(role) ? "permission-on" : "permission-off"}>Chạy AI workflow</span>
            <span className={canManageSettings(role) ? "permission-on" : "permission-off"}>Quản lý settings</span>
          </div>
        </div>

        <div className="admin-panel">
          <h2>Thông số hệ thống</h2>
          <div className="system-list">
            <div>
              <span>Database</span>
              <strong>{db.connected ? "PostgreSQL" : "Local JSON"}</strong>
            </div>
            <div>
              <span>Pages</span>
              <strong>{pages.length}</strong>
            </div>
            <div>
              <span>Tags</span>
              <strong>{tags.length}</strong>
            </div>
            <div>
              <span>Media</span>
              <strong>{media.length}</strong>
            </div>
            <div>
              <span>Thiếu SEO</span>
              <strong>{missingSeoPosts.length}</strong>
            </div>
          </div>
          <p className="table-note">{db.message}</p>
        </div>
      </section>

      {missingSeoPosts.length > 0 ? (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Bài thiếu SEO</h2>
              <p>Nên bổ sung SEO title và meta description trước khi xuất bản mạnh.</p>
            </div>
          </div>
          <div className="mini-list">
            {missingSeoPosts.map((post) => (
              <Link key={post.id} href={`/admin/posts/${post.id}/edit`} className="mini-list-row">
                <span>{post.title}</span>
                <span className="muted-text">{post.category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AdminLayout>
  );
}
