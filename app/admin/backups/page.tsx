import { DatabaseBackup, Download, ShieldAlert, ShieldCheck, Upload } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { createBackupSnapshot } from "@/lib/content";
import { getDatabaseStatus } from "@/lib/db";
import { restoreBackupAction } from "./actions";

export const dynamic = "force-dynamic";

function countItems(value: unknown) {
  return Array.isArray(value) ? value.length : 1;
}

function errorMessage(error?: string) {
  if (error === "missing-file") return "Vui lòng chọn file backup JSON.";
  if (error === "invalid-backup") return "File backup không hợp lệ hoặc không thể nhập.";
  return "";
}

export default async function AdminBackupsPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string; error?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canManageSettings(role)) redirect("/admin?error=permission");

  const [snapshot, params] = await Promise.all([createBackupSnapshot(), searchParams]);
  const db = getDatabaseStatus();
  const entries = Object.entries(snapshot.data).map(([key, value]) => ({
    key,
    count: countItems(value),
  }));
  const message = errorMessage(params.error);

  return (
    <AdminLayout title="Backup dữ liệu">
      {params.restored === "1" ? <p className="success-message">Đã khôi phục dữ liệu từ file backup.</p> : null}
      {message ? <p className="login-error">{message}</p> : null}

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Xuất dữ liệu CMS</h2>
            <p>Tải một gói JSON chứa nội dung, cấu hình và dữ liệu vận hành hiện tại.</p>
          </div>
          <a className="primary-button" href="/api/admin/backup">
            <Download size={17} strokeWidth={1.9} />
            Tải backup
          </a>
        </div>

        <div className="backup-summary">
          <div>
            <DatabaseBackup size={22} strokeWidth={1.8} />
            <span>Nguồn dữ liệu</span>
            <strong>{snapshot.metadata.source}</strong>
          </div>
          <div>
            <ShieldCheck size={22} strokeWidth={1.8} />
            <span>Thời điểm xuất</span>
            <strong>{new Date(snapshot.metadata.exportedAt).toLocaleString("vi-VN")}</strong>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Khôi phục từ backup</h2>
            <p>Nhập lại file JSON đã xuất từ FadoBlog. Chế độ ghi đè hiện chỉ bật khi chạy local JSON.</p>
          </div>
          <ShieldAlert size={22} strokeWidth={1.8} />
        </div>

        {db.connected ? (
          <p className="login-error">Website đang dùng PostgreSQL. Để an toàn, import trực tiếp từ giao diện đang được khóa.</p>
        ) : (
          <form action={restoreBackupAction} className="editor-form compact-form">
            <label>
              File backup JSON
              <input name="backupFile" type="file" accept="application/json,.json" required />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button">
                <Upload size={17} strokeWidth={1.9} />
                Khôi phục dữ liệu
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Nội dung trong backup</h2>
            <p>Kiểm tra nhanh các nhóm dữ liệu sẽ có trong file xuất.</p>
          </div>
        </div>
        <div className="admin-table">
          <div className="admin-table-row backup-row admin-table-head">
            <span>Nhóm dữ liệu</span>
            <span>Số lượng</span>
          </div>
          {entries.map((entry) => (
            <div className="admin-table-row backup-row" key={entry.key}>
              <strong>{entry.key}</strong>
              <span>{entry.count}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
