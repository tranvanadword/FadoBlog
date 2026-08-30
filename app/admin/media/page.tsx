import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canDeleteContent, canManageMedia, getCurrentAdminRole } from "@/lib/auth";
import { listMedia } from "@/lib/content";
import { deleteMediaAction } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  missing: "Vui lòng chọn một file ảnh.",
  type: "Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.",
  size: "Ảnh tối đa 5MB.",
  permission: "Vai trò hiện tại không có quyền thực hiện thao tác này.",
  storage: "Không lưu được file ảnh lên Cloudflare storage.",
  library: "Đã lưu file nhưng không ghi được vào thư viện media.",
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canManageMedia(role)) redirect("/admin?error=permission");

  const [media, params] = await Promise.all([listMedia(), searchParams]);
  const allowDelete = canDeleteContent(role);

  return (
    <AdminLayout title="Media Library">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Upload ảnh</h2>
            <p>Ảnh upload sẽ được lưu trong Cloudflare storage khi deploy, với URL dùng làm ảnh đại diện bài viết.</p>
          </div>
        </div>

        {params.error ? <p className="login-error">{errorMessages[params.error] ?? "Không upload được ảnh."}</p> : null}

        <form action="/admin/media/upload" method="post" encType="multipart/form-data" className="editor-form compact-form">
          <label>
            File ảnh
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          </label>
          <label>
            Alt text
            <input name="altText" placeholder="Mô tả ngắn cho ảnh" />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button">
              Upload ảnh
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Ảnh đã upload</h2>
        {media.length === 0 ? (
          <p className="page-intro">Chưa có ảnh nào trong thư viện.</p>
        ) : (
          <div className="media-grid">
            {media.map((item) => (
              <article className="media-card" key={item.id}>
                <img src={item.url} alt={item.altText || "Media upload"} />
                <div>
                  <strong>{item.altText || "Chưa có alt text"}</strong>
                  <p>{item.url}</p>
                  <span>{formatFileSize(item.size)}</span>
                </div>
                {allowDelete ? (
                  <form action={deleteMediaAction.bind(null, item.id)}>
                    <button className="danger-button" type="submit">
                      Xóa
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
