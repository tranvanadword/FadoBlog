import type { Tag } from "@/lib/types";

type TagEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  tag?: Tag;
};

export function TagEditor({ action, tag }: TagEditorProps) {
  return (
    <form action={action} className="editor-form compact-form">
      <div className="editor-grid">
        <label>
          Tên tag
          <input name="name" defaultValue={tag?.name} placeholder="Ví dụ: AI" required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={tag?.slug} placeholder="ai" />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Lưu tag
        </button>
      </div>
    </form>
  );
}
