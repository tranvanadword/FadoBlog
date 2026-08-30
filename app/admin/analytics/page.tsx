import { BarChart3, CalendarDays, Clock3, Eye, FileText, MousePointerClick, Share2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canPublish, getCurrentAdminRole } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/content";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sourceLabel(referrer?: string) {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

export default async function AdminAnalyticsPage() {
  const role = await getCurrentAdminRole();
  if (!canPublish(role)) redirect("/admin?error=permission");

  const summary = await getAnalyticsSummary();
  const maxViews = Math.max(1, ...summary.topPosts.map((post) => post.views));

  return (
    <AdminLayout title="Analytics">
      <div className="metric-grid">
        <div className="metric-card">
          <span>Tổng lượt xem</span>
          <span className="metric-icon">
            <Eye size={20} strokeWidth={1.9} />
          </span>
          <strong>{summary.totalViews}</strong>
        </div>
        <div className="metric-card">
          <span>Lượt xem bài viết</span>
          <span className="metric-icon cyan">
            <FileText size={20} strokeWidth={1.9} />
          </span>
          <strong>{summary.postViews}</strong>
        </div>
        <div className="metric-card">
          <span>Hôm nay</span>
          <span className="metric-icon green">
            <CalendarDays size={20} strokeWidth={1.9} />
          </span>
          <strong>{summary.todayViews}</strong>
        </div>
        <div className="metric-card">
          <span>7 ngày gần đây</span>
          <span className="metric-icon yellow">
            <MousePointerClick size={20} strokeWidth={1.9} />
          </span>
          <strong>{summary.last7DaysViews}</strong>
        </div>
      </div>

      <section className="dashboard-grid">
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Top bài viết</h2>
              <p>Các bài đang có lượt đọc cao nhất.</p>
            </div>
            <span className="admin-panel-icon">
              <TrendingUp size={21} strokeWidth={1.9} />
            </span>
          </div>
          {summary.topPosts.length === 0 ? (
            <div className="empty-state compact-empty">
              <BarChart3 size={28} strokeWidth={1.8} />
              <strong>Chưa có dữ liệu lượt xem.</strong>
              <span>Mở một bài viết public để hệ thống bắt đầu ghi nhận.</span>
            </div>
          ) : (
            <div className="analytics-list">
              {summary.topPosts.map((post) => (
                <Link className="analytics-row" href={`/post/${post.slug}`} key={post.postId}>
                  <span>
                    <strong>{post.title}</strong>
                    <em>{post.categoryName}</em>
                  </span>
                  <span className="analytics-bar" aria-hidden="true">
                    <i style={{ width: `${Math.max(5, (post.views / maxViews) * 100)}%` }} />
                  </span>
                  <b>{post.views}</b>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Nguồn truy cập</h2>
              <p>Nguồn referrer cơ bản từ các lượt xem đã ghi nhận.</p>
            </div>
            <span className="admin-panel-icon cyan">
              <Share2 size={21} strokeWidth={1.9} />
            </span>
          </div>
          {summary.referrers.length === 0 ? (
            <p className="page-intro">Chưa có dữ liệu nguồn truy cập.</p>
          ) : (
            <div className="mini-list">
              {summary.referrers.map((source) => (
                <div className="mini-list-row" key={source.source}>
                  <span>{source.source}</span>
                  <strong>{source.views}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Lượt xem gần đây</h2>
            <p>Dòng sự kiện mới nhất từ public site.</p>
          </div>
          <span className="admin-panel-icon green">
            <Clock3 size={21} strokeWidth={1.9} />
          </span>
        </div>
        {summary.recentViews.length === 0 ? (
          <div className="empty-state compact-empty">
            <Eye size={28} strokeWidth={1.8} />
            <strong>Chưa có lượt xem nào.</strong>
            <span>Dữ liệu sẽ xuất hiện sau khi độc giả mở bài viết.</span>
          </div>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row analytics-event-row admin-table-head">
              <span>Đường dẫn</span>
              <span>Nguồn</span>
              <span>Thời gian</span>
            </div>
            {summary.recentViews.map((view) => (
              <div className="admin-table-row analytics-event-row" key={view.id}>
                <span>{view.path}</span>
                <span>{sourceLabel(view.referrer)}</span>
                <span>{formatDate(view.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
