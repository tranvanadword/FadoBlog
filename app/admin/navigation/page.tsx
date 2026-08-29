import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { getSiteSettings, listCategories, listPublishedPages } from "@/lib/content";
import type { NavigationLink } from "@/lib/types";
import { updateNavigationAction } from "./actions";

export const dynamic = "force-dynamic";

function linksToText(links: NavigationLink[]) {
  return links.map((link) => `${link.label} | ${link.href}`).join("\n");
}

export default async function AdminNavigationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canManageSettings(role)) redirect("/admin?error=permission");

  const [settings, categories, pages, params] = await Promise.all([
    getSiteSettings(),
    listCategories(),
    listPublishedPages(),
    searchParams,
  ]);
  const defaultHeader = categories.map((category) => `${category.name} | /category/${category.slug}`).join("\n");
  const defaultFooter = [
    ...categories.map((category) => `${category.name} | /category/${category.slug}`),
    ...pages.map((page) => `${page.title} | /page/${page.slug}`),
    "RSS | /rss.xml",
  ].join("\n");

  return (
    <AdminLayout title="Navigation">
      {params.saved ? <p className="success-message">Đã lưu menu.</p> : null}

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Quản lý header và footer</h2>
            <p>Mỗi dòng nhập theo dạng: Tên hiển thị | URL.</p>
          </div>
        </div>

        <form action={updateNavigationAction} className="editor-form">
          <label>
            Header menu
            <textarea
              name="headerLinks"
              rows={8}
              defaultValue={settings.headerLinks.length > 0 ? linksToText(settings.headerLinks) : defaultHeader}
            />
          </label>

          <label>
            Footer menu
            <textarea
              name="footerLinks"
              rows={10}
              defaultValue={settings.footerLinks.length > 0 ? linksToText(settings.footerLinks) : defaultFooter}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              Lưu menu
            </button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}
