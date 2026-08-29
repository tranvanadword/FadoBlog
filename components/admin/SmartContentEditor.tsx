"use client";

import { Eye, Link2, SearchCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { VisualContentEditor } from "./VisualContentEditor";

type SmartContentEditorProps = {
  type: "post" | "page";
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
  initialSeoTitle?: string;
  initialMetaDescription?: string;
};

function toSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toPlainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}

function wordCount(value: string) {
  return toPlainText(value).trim().split(/\s+/).filter(Boolean).length;
}

function readingMinutes(value: string) {
  return Math.max(1, Math.ceil(wordCount(value) / 220));
}

function statusClass(ok: boolean) {
  return ok ? "seo-check-ok" : "seo-check-warn";
}

export function SmartContentEditor({
  type,
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialContent = "",
  initialSeoTitle = "",
  initialMetaDescription = "",
}: SmartContentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent);
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);

  const suggestedSlug = useMemo(() => toSlug(title), [title]);
  const suggestedMeta = useMemo(() => {
    const source = excerpt || content;
    return toPlainText(source).replace(/\s+/g, " ").trim().slice(0, 155);
  }, [content, excerpt]);
  const previewTitle = seoTitle || title || (type === "post" ? "Tiêu đề bài viết" : "Tiêu đề page");
  const previewDescription = metaDescription || suggestedMeta || "Mô tả SEO sẽ hiển thị tại đây.";

  const checks = [
    { label: "Có tiêu đề", ok: title.trim().length >= 10 },
    { label: "Slug rõ ràng", ok: (slug || suggestedSlug).length >= 5 },
    { label: "SEO title vừa đủ", ok: previewTitle.length >= 20 && previewTitle.length <= 70 },
    { label: "Meta description tốt", ok: previewDescription.length >= 80 && previewDescription.length <= 160 },
    { label: "Nội dung đủ đọc", ok: wordCount(content) >= (type === "post" ? 120 : 40) },
  ];

  return (
    <div className="smart-editor">
      <div className="smart-editor-fields">
        <div className="editor-grid">
          <label>
            Tiêu đề
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={type === "post" ? "Nhập tiêu đề bài viết" : "Ví dụ: Giới thiệu FadoBlog"}
              required
            />
          </label>
          <label>
            Slug
            <div className="input-with-button">
              <input
                name="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={suggestedSlug || "duong-dan-noi-dung"}
              />
              <button type="button" className="secondary-action small-action" onClick={() => setSlug(suggestedSlug)}>
                <Link2 size={15} strokeWidth={1.9} />
                Gợi ý
              </button>
            </div>
          </label>
        </div>

        {type === "post" ? (
          <label>
            Mô tả ngắn
            <textarea
              name="excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={3}
              placeholder="Tóm tắt hiển thị ở trang danh sách"
            />
          </label>
        ) : null}

        <label>
          Nội dung
          <VisualContentEditor
            name="content"
            value={content}
            onChange={setContent}
            placeholder={type === "post" ? "Nội dung bài viết" : "Nội dung trang tĩnh"}
            minRows={type === "post" ? 13 : 15}
          />
        </label>

        <div className="editor-grid">
          <label>
            SEO title
            <input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="Tiêu đề SEO" />
          </label>
          <label>
            Meta description
            <div className="input-with-button">
              <input
                name="metaDescription"
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                placeholder="Mô tả SEO ngắn"
              />
              <button type="button" className="secondary-action small-action" onClick={() => setMetaDescription(suggestedMeta)}>
                <Sparkles size={15} strokeWidth={1.9} />
                Gợi ý
              </button>
            </div>
          </label>
        </div>
      </div>

      <aside className="editor-assistant-panel">
        <section>
          <div className="assistant-heading">
            <SearchCheck size={18} strokeWidth={1.9} />
            <h3>Checklist SEO</h3>
          </div>
          <div className="seo-check-list">
            {checks.map((check) => (
              <span className={statusClass(check.ok)} key={check.label}>
                {check.label}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="assistant-heading">
            <Eye size={18} strokeWidth={1.9} />
            <h3>Preview</h3>
          </div>
          <div className="serp-preview">
            <small>{slug || suggestedSlug || "duong-dan-noi-dung"}</small>
            <strong>{previewTitle}</strong>
            <p>{previewDescription}</p>
          </div>
        </section>

        <section className="editor-stats">
          <div>
            <span>Từ</span>
            <strong>{wordCount(content)}</strong>
          </div>
          <div>
            <span>Phút đọc</span>
            <strong>{readingMinutes(content)}</strong>
          </div>
          <div>
            <span>Meta</span>
            <strong>{previewDescription.length}</strong>
          </div>
        </section>
      </aside>
    </div>
  );
}
