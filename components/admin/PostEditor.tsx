import type { AdminRole } from "@/lib/auth";
import { allowedPostStatuses } from "@/lib/auth";
import type { Category, MediaItem, Post, PostStatus, Tag } from "@/lib/types";
import { SmartContentEditor } from "./SmartContentEditor";

type PostEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  media: MediaItem[];
  tags: Tag[];
  role: AdminRole;
  post?: Post;
};

const statusLabels: Record<PostStatus, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  scheduled: "Đã lên lịch",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

export function PostEditor({ action, categories, media, tags, role, post }: PostEditorProps) {
  const statuses = allowedPostStatuses(role);

  return (
    <form action={action} className="editor-form wide-editor-form">
      <SmartContentEditor
        type="post"
        initialTitle={post?.title}
        initialSlug={post?.slug}
        initialExcerpt={post?.excerpt}
        initialContent={post?.content}
        initialSeoTitle={post?.seoTitle}
        initialMetaDescription={post?.metaDescription}
      />

      <div className="editor-grid">
        <label>
          Chuyên mục
          <select name="categorySlug" defaultValue={post?.category.slug ?? categories[0]?.slug}>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select name="status" defaultValue={post?.status ?? "draft"}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Tags
        <input name="tags" defaultValue={post?.tags.join(", ")} placeholder="Ví dụ: AI, công nghệ, hướng dẫn" />
      </label>
      {tags.length > 0 ? (
        <div className="tag-suggestions">
          {tags.map((tag) => (
            <span key={tag.id}>{tag.name}</span>
          ))}
        </div>
      ) : null}

      <label>
        Ảnh đại diện
        <input name="coverImage" defaultValue={post?.coverImage} placeholder="https://... hoặc /uploads/anh.jpg" />
      </label>

      {media.length > 0 ? (
        <label>
          Chọn từ Media Library
          <select name="mediaCoverImage" defaultValue="">
            <option value="">Giữ URL ảnh ở trên</option>
            {media.map((item) => (
              <option key={item.id} value={item.url}>
                {item.altText || item.url}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Lưu bài viết
        </button>
      </div>
    </form>
  );
}
