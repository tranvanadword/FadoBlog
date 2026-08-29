import { Lock, Plus, Save, Unlock } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminRoles, canManageUsers, getCurrentAdminRole, getRoleLabel } from "@/lib/auth";
import { getDatabaseStatus } from "@/lib/db";
import { listUsers } from "@/lib/users";
import { createUserAction, toggleUserActiveAction, updateUserAction } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  missing: "Vui lòng nhập đầy đủ tên, email và mật khẩu khi tạo tài khoản.",
  password: "Mật khẩu tối thiểu 8 ký tự.",
  self: "Không thể tự khóa tài khoản hoặc hạ quyền admin của chính mình.",
  "last-admin": "Cần giữ lại ít nhất một admin đang hoạt động.",
  create: "Không tạo được tài khoản. Email có thể đã tồn tại hoặc database chưa sẵn sàng.",
  update: "Không cập nhật được tài khoản.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canManageUsers(role)) redirect("/admin?error=permission");

  const [users, params] = await Promise.all([listUsers(), searchParams]);
  const databaseReady = getDatabaseStatus().connected;

  return (
    <AdminLayout title="Quản trị người dùng">
      {params.error ? <p className="login-error">{errorMessages[params.error] ?? "Thao tác không thành công."}</p> : null}
      {params.saved ? <p className="success-message">Đã cập nhật tài khoản.</p> : null}
      {!databaseReady ? (
        <p className="login-error">
          CMS đang chạy bằng cấu hình local trong file .env, chưa kết nối database nên chưa thể tạo hoặc cập nhật tài khoản thật.
        </p>
      ) : null}

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Tạo tài khoản mới</h2>
            <p>Admin có thể thêm biên tập viên, tác giả hoặc tài khoản AI writer cho CMS.</p>
          </div>
        </div>

        <form action={createUserAction} className="editor-form">
          <div className="editor-grid">
            <label>
              Tên hiển thị
              <input name="name" placeholder="Fado Editor" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="editor@fadoblog.local" required />
            </label>
          </div>
          <div className="editor-grid">
            <label>
              Vai trò
              <select name="role" defaultValue="author">
                {adminRoles.map((item) => (
                  <option key={item} value={item}>
                    {getRoleLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mật khẩu
              <input name="password" type="password" minLength={8} required />
            </label>
          </div>
          <label className="inline-check">
            <input name="active" type="checkbox" defaultChecked />
            Đang hoạt động
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={!databaseReady}>
              <Plus size={17} strokeWidth={1.9} />
              Tạo tài khoản
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Danh sách tài khoản</h2>
            <p>Quản lý vai trò, trạng thái đăng nhập và đặt lại mật khẩu khi cần.</p>
          </div>
        </div>

        <div className="admin-table">
          <div className="admin-table-row user-row admin-table-head">
            <span>Tài khoản</span>
            <span>Vai trò</span>
            <span>Trạng thái</span>
            <span>Bài viết</span>
            <span>Cập nhật</span>
            <span>Thao tác</span>
          </div>

          {users.map((user) => (
            <form className="admin-table-row user-row" action={updateUserAction.bind(null, user.id)} key={user.id}>
              <div className="user-cell">
                <input name="name" defaultValue={user.name} required aria-label="Tên hiển thị" disabled={!databaseReady} />
                <input name="email" type="email" defaultValue={user.email} required aria-label="Email" disabled={!databaseReady} />
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Mật khẩu mới nếu cần"
                  aria-label="Mật khẩu mới"
                  disabled={!databaseReady}
                />
              </div>
              <select name="role" defaultValue={user.role} aria-label="Vai trò" disabled={!databaseReady}>
                {adminRoles.map((item) => (
                  <option key={item} value={item}>
                    {getRoleLabel(item)}
                  </option>
                ))}
              </select>
              <label className="table-check">
                <input name="active" type="checkbox" defaultChecked={user.active} disabled={!databaseReady} />
                {user.active ? "Đang hoạt động" : "Đã khóa"}
              </label>
              <span>{user.postCount}</span>
              <span className="muted-text">{user.updatedAt}</span>
              <div className="row-actions">
                <button className="secondary-action small-action" type="submit" disabled={!databaseReady}>
                  <Save size={16} strokeWidth={1.9} />
                  Lưu
                </button>
                <button
                  className={user.active ? "danger-button" : "secondary-action small-action"}
                  formAction={toggleUserActiveAction.bind(null, user.id, !user.active)}
                  type="submit"
                  disabled={!databaseReady}
                >
                  {user.active ? <Lock size={16} strokeWidth={1.9} /> : <Unlock size={16} strokeWidth={1.9} />}
                  {user.active ? "Khóa" : "Mở"}
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
