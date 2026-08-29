import type { AdminRole } from "@/lib/auth";
import { allowedPageStatuses } from "@/lib/auth";
import type { PostStatus, StaticPage } from "@/lib/types";
import { SmartContentEditor } from "./SmartContentEditor";

type PageEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  role: AdminRole;
  page?: StaticPage;
};

const statusLabels: Record<PostStatus, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  scheduled: "Đã lên lịch",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

export function PageEditor({ action, role, page }: PageEditorProps) {
  const statuses = allowedPageStatuses(role);

  return (
    <form action={action} className="editor-form wide-editor-form">
      <SmartContentEditor
        type="page"
        initialTitle={page?.title}
        initialSlug={page?.slug}
        initialContent={page?.content}
        initialSeoTitle={page?.seoTitle}
        initialMetaDescription={page?.metaDescription}
      />

      <label>
        Trạng thái
        <select name="status" defaultValue={page?.status ?? "draft"}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Lưu page
        </button>
      </div>
    </form>
  );
}
