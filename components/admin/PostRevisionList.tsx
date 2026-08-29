import { Clock3, RotateCcw } from "lucide-react";
import type { PostRevision } from "@/lib/types";

type PostRevisionListProps = {
  revisions: PostRevision[];
  restoreAction: (formData: FormData) => void | Promise<void>;
};

function formatRevisionDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function previewText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function PostRevisionList({ revisions, restoreAction }: PostRevisionListProps) {
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Lịch sử chỉnh sửa</h2>
          <p>Mỗi lần lưu bài, phiên bản trước đó sẽ được giữ lại tại đây.</p>
        </div>
      </div>

      {revisions.length === 0 ? (
        <div className="empty-state compact-empty">
          <Clock3 size={26} strokeWidth={1.8} />
          <strong>Chưa có phiên bản cũ.</strong>
          <span>Sau lần sửa tiếp theo, lịch sử sẽ xuất hiện ở khu vực này.</span>
        </div>
      ) : (
        <div className="revision-list">
          {revisions.map((revision) => (
            <article className="revision-card" key={revision.id}>
              <div>
                <span>{formatRevisionDate(revision.createdAt)}</span>
                <strong>{revision.snapshot.title || "Phiên bản cũ"}</strong>
                <p>{previewText(revision.snapshot.content) || "Không có nội dung preview."}</p>
              </div>
              <form action={restoreAction}>
                <input type="hidden" name="revisionId" value={revision.id} />
                <button type="submit" className="secondary-action small-action">
                  <RotateCcw size={15} strokeWidth={1.9} />
                  Khôi phục
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
