import type { PostStatus } from "@/lib/types";

const labels: Record<PostStatus, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  scheduled: "Đã lên lịch",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return <span className={"status-badge status-" + status}>{labels[status]}</span>;
}
