import { Activity, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { listAuditLogs } from "@/lib/content";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminAuditLogsPage() {
  const role = await getCurrentAdminRole();
  if (!canManageSettings(role)) redirect("/admin?error=permission");

  const logs = await listAuditLogs();

  return (
    <AdminLayout title="Audit log">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Nhật ký quản trị nhẹ</h2>
            <p>Chỉ ghi các thao tác quan trọng, không lưu nội dung bài viết đầy đủ.</p>
          </div>
          <ShieldCheck size={22} strokeWidth={1.8} />
        </div>

        {logs.length === 0 ? (
          <div className="empty-state compact-empty">
            <Activity size={28} strokeWidth={1.8} />
            <strong>Chưa có log quản trị.</strong>
            <span>Khi admin thao tác, các sự kiện quan trọng sẽ xuất hiện ở đây.</span>
          </div>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row audit-row admin-table-head">
              <span>Thời gian</span>
              <span>Người thao tác</span>
              <span>Hành động</span>
              <span>Nội dung</span>
            </div>
            {logs.map((log) => (
              <div className="admin-table-row audit-row" key={log.id}>
                <span>{formatDate(log.createdAt)}</span>
                <span>{log.actorEmail ?? "System"}</span>
                <strong>{log.action}</strong>
                <span>{log.summary}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
