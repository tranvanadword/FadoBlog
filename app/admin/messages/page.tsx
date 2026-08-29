import { Archive, MailCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { listContactMessages } from "@/lib/content";
import { archiveMessageAction, markMessageReadAction } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "read") return "Đã đọc";
  if (status === "archived") return "Lưu trữ";
  return "Mới";
}

export default async function AdminMessagesPage() {
  const role = await getCurrentAdminRole();
  if (!canManageSettings(role)) redirect("/admin?error=permission");

  const messages = await listContactMessages();
  const visibleMessages = messages.filter((message) => message.status !== "archived");
  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <AdminLayout title="Hộp thư liên hệ">
      <div className="metric-grid">
        <div className="metric-card">
          <span>Tin mới</span>
          <strong>{newCount}</strong>
        </div>
        <div className="metric-card">
          <span>Đang xử lý</span>
          <strong>{visibleMessages.length}</strong>
        </div>
        <div className="metric-card">
          <span>Đã lưu trữ</span>
          <strong>{messages.filter((message) => message.status === "archived").length}</strong>
        </div>
        <div className="metric-card">
          <span>Tổng tin</span>
          <strong>{messages.length}</strong>
        </div>
      </div>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Tin nhắn từ trang Liên hệ</h2>
            <p>Quản lý phản hồi, hợp tác và yêu cầu từ độc giả.</p>
          </div>
        </div>

        {visibleMessages.length === 0 ? (
          <div className="empty-state compact-empty">
            <MailCheck size={28} strokeWidth={1.8} />
            <strong>Chưa có tin nhắn cần xử lý.</strong>
            <span>Khi độc giả gửi form liên hệ, nội dung sẽ xuất hiện tại đây.</span>
          </div>
        ) : (
          <div className="message-list">
            {visibleMessages.map((message) => (
              <article className="message-card" key={message.id}>
                <div className="message-card-head">
                  <div>
                    <span className={message.status === "new" ? "permission-on" : "status-badge status-draft"}>{statusLabel(message.status)}</span>
                    <h3>{message.subject}</h3>
                  </div>
                  <time>{formatDate(message.createdAt)}</time>
                </div>
                <p>{message.message}</p>
                <div className="message-meta">
                  <strong>{message.name}</strong>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </div>
                <div className="row-actions">
                  {message.status === "new" ? (
                    <form action={markMessageReadAction.bind(null, message.id)}>
                      <button className="secondary-action small-action" type="submit">
                        <MailCheck size={15} strokeWidth={1.9} />
                        Đã đọc
                      </button>
                    </form>
                  ) : null}
                  <form action={archiveMessageAction.bind(null, message.id)}>
                    <button className="secondary-action small-action" type="submit">
                      <Archive size={15} strokeWidth={1.9} />
                      Lưu trữ
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
