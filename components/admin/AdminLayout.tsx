import { Bell, Globe2, LogOut, Search, Settings2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/login/actions";
import { getCurrentAdminUser, getRoleLabel } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";

export async function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const user = await getCurrentAdminUser();

  return (
    <main className="admin-shell">
      <AdminSidebar user={user} />
      <section className="admin-main">
        <div className="admin-commandbar">
          <form className="admin-search" action="/admin/search">
            <Search size={18} strokeWidth={1.9} />
            <input name="q" placeholder="Tìm bài viết, page, media, workflow..." aria-label="Tìm trong CMS" />
          </form>
          <div className="admin-quick-actions">
            <button className="icon-button" type="button" aria-label="Thông báo">
              <Bell size={18} strokeWidth={1.9} />
              <span className="notify-dot">3</span>
            </button>
            <Link className="icon-button" href="/admin/settings" aria-label="Settings">
              <Settings2 size={18} strokeWidth={1.9} />
            </Link>
            <Link className="secondary-action" href="/">
              <Globe2 size={17} strokeWidth={1.9} />
              Xem website
            </Link>
          </div>
        </div>

        <div className="admin-topbar">
          <div>
            <p className="eyebrow">FadoBlog CMS</p>
            <h1>{title}</h1>
          </div>
          <div className="admin-topbar-actions">
            <span className="role-pill">{getRoleLabel(user.role)}</span>
            <form action={logoutAction}>
              <button className="secondary-action" type="submit">
                <LogOut size={17} strokeWidth={1.9} />
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
