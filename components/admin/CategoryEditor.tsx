import type { Category } from "@/lib/types";

type CategoryEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  category?: Category;
};

export function CategoryEditor({ action, category }: CategoryEditorProps) {
  return (
    <form action={action} className="editor-form compact-form">
      <div className="editor-grid">
        <label>
          Tên chuyên mục
          <input name="name" defaultValue={category?.name} placeholder="Ví dụ: Kinh doanh" required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={category?.slug} placeholder="kinh-doanh" />
        </label>
      </div>

      <label>
        Mô tả
        <textarea name="description" defaultValue={category?.description} rows={4} placeholder="Mô tả ngắn về chuyên mục" />
      </label>

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Lưu chuyên mục
        </button>
      </div>
    </form>
  );
}
