import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { getSiteSettings } from "@/lib/content";
import { updateSiteSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canManageSettings(role)) redirect("/admin?error=permission");

  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);

  return (
    <AdminLayout title="Settings">
      {params.saved ? <p className="success-message">Đã lưu cấu hình site.</p> : null}

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Thông tin site</h2>
            <p>Các giá trị này được dùng cho header, footer, SEO mặc định, sitemap, robots và RSS.</p>
          </div>
        </div>

        <form action={updateSiteSettingsAction} className="editor-form">
          <div className="editor-grid">
            <label>
              Tên site
              <input name="siteName" defaultValue={settings.siteName} required />
            </label>
            <label>
              Domain public
              <input name="publicUrl" defaultValue={settings.publicUrl} placeholder="https://fadoblog.com" required />
            </label>
          </div>

          <label>
            Mô tả site
            <textarea name="siteDescription" defaultValue={settings.siteDescription} rows={3} required />
          </label>

          <label>
            Logo URL
            <input name="logoUrl" defaultValue={settings.logoUrl} placeholder="/uploads/logo.png hoặc https://..." />
          </label>

          <div className="editor-grid">
            <label>
              SEO title mặc định
              <input name="defaultSeoTitle" defaultValue={settings.defaultSeoTitle} required />
            </label>
            <label>
              Email liên hệ
              <input name="contactEmail" defaultValue={settings.contactEmail} placeholder="hello@fadoblog.com" />
            </label>
          </div>

          <label>
            Meta description mặc định
            <textarea name="defaultMetaDescription" defaultValue={settings.defaultMetaDescription} rows={3} required />
          </label>

          <div className="editor-grid">
            <label>
              Facebook
              <input name="facebookUrl" defaultValue={settings.facebookUrl} placeholder="https://facebook.com/..." />
            </label>
            <label>
              YouTube
              <input name="youtubeUrl" defaultValue={settings.youtubeUrl} placeholder="https://youtube.com/..." />
            </label>
          </div>

          <label>
            LinkedIn
            <input name="linkedinUrl" defaultValue={settings.linkedinUrl} placeholder="https://linkedin.com/company/..." />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              Lưu settings
            </button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}
