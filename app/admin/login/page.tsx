import { loginAction } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">FadoBlog CMS</p>
          <h1>Đăng nhập admin</h1>
          <p className="page-intro">Vào khu quản trị để quản lý bài viết, chuyên mục, page tĩnh và workflow AI.</p>
        </div>

        {params.error ? <p className="login-error">Email hoặc mật khẩu chưa đúng.</p> : null}

        <form action={loginAction} className="editor-form">
          <input type="hidden" name="next" value={params.next ?? "/admin"} />
          <label>
            Email
            <input name="email" type="email" defaultValue="admin@fadoblog.local" required />
          </label>
          <label>
            Mật khẩu
            <input name="password" type="password" defaultValue="fadoblog-admin" required />
          </label>
          <button type="submit" className="primary-button">
            Đăng nhập
          </button>
        </form>

        <p className="login-note">Tài khoản dev mặc định có thể đổi bằng ADMIN_EMAIL và ADMIN_PASSWORD trong file .env.</p>
      </section>
    </main>
  );
}
