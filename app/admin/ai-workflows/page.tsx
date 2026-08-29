import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { canDeleteContent, canUseAiWorkflow, getCurrentAdminRole } from "@/lib/auth";
import { listAiJobs, listAiWorkflows, listCategories } from "@/lib/content";
import {
  createAiWorkflowAction,
  deleteAiWorkflowAction,
  generateAiDraftAction,
  runDueAiWorkflowsAction,
  runAiWorkflowAction,
  toggleAiWorkflowAction,
} from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  missing: "Vui lòng nhập chủ đề và chọn chuyên mục.",
  "workflow-missing": "Vui lòng nhập tên workflow, chủ đề mẫu và chuyên mục.",
  permission: "Vai trò hiện tại không có quyền thực hiện thao tác này.",
};

export default async function AdminAiWorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const role = await getCurrentAdminRole();
  if (!canUseAiWorkflow(role)) redirect("/admin?error=permission");

  const [categories, workflows, jobs, params] = await Promise.all([
    listCategories(),
    listAiWorkflows(),
    listAiJobs(),
    searchParams,
  ]);
  const usesOpenAi = Boolean(process.env.OPENAI_API_KEY);
  const allowDelete = canDeleteContent(role);

  return (
    <AdminLayout title="AI Workflow">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Tạo bài nháp nhanh</h2>
            <p>
              Chế độ hiện tại: <strong>{usesOpenAi ? "OpenAI API" : "Mock AI local"}</strong>
            </p>
          </div>
        </div>

        {params.error ? <p className="login-error">{errorMessages[params.error] ?? "Không xử lý được workflow."}</p> : null}

        <form action={generateAiDraftAction} className="editor-form">
          <label>
            Keyword hoặc chủ đề
            <input name="topic" placeholder="Ví dụ: xu hướng AI trong thương mại điện tử" required />
          </label>

          <div className="editor-grid">
            <label>
              Chuyên mục
              <select name="categorySlug" defaultValue={categories[0]?.slug}>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kiểu bài
              <select name="tone" defaultValue="news">
                <option value="news">Tin tức</option>
                <option value="guide">Hướng dẫn</option>
                <option value="review">Đánh giá</option>
              </select>
            </label>
          </div>

          <label>
            Trạng thái sau khi tạo
            <select name="targetStatus" defaultValue="draft">
              <option value="draft">Nháp</option>
              <option value="pending_review">Chờ duyệt</option>
            </select>
          </label>

          <label>
            Ghi chú cho AI
            <textarea rows={5} name="notes" placeholder="Góc nhìn, độ dài, đối tượng độc giả, nguồn cần tham khảo..." />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              Tạo draft
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Workflow tự động</h2>
            <p>Lưu prompt mẫu để chạy lại nhiều lần hoặc nối lịch chạy ở bước triển khai production.</p>
          </div>
          <form action={runDueAiWorkflowsAction}>
            <button type="submit" className="secondary-action">
              Chạy workflow đến hạn
            </button>
          </form>
        </div>

        <form action={createAiWorkflowAction} className="editor-form">
          <div className="editor-grid">
            <label>
              Tên workflow
              <input name="name" placeholder="Ví dụ: Tin công nghệ mỗi sáng" required />
            </label>
            <label>
              Lịch chạy
              <select name="scheduleRule" defaultValue="manual">
                <option value="manual">Chạy thủ công</option>
                <option value="daily-08:00">Hàng ngày 08:00</option>
                <option value="weekly-monday-08:00">Thứ hai hàng tuần 08:00</option>
              </select>
            </label>
          </div>

          <label>
            Chủ đề mẫu
            <input name="topicTemplate" placeholder="Ví dụ: 5 xu hướng AI đáng chú ý trong tuần" required />
          </label>

          <div className="editor-grid">
            <label>
              Chuyên mục đích
              <select name="categorySlug" defaultValue={categories[0]?.slug}>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kiểu bài
              <select name="tone" defaultValue="news">
                <option value="news">Tin tức</option>
                <option value="guide">Hướng dẫn</option>
                <option value="review">Đánh giá</option>
              </select>
            </label>
          </div>

          <label>
            Trạng thái sau khi sinh bài
            <select name="targetStatus" defaultValue="pending_review">
              <option value="draft">Nháp</option>
              <option value="pending_review">Chờ duyệt</option>
            </select>
          </label>

          <label>
            Prompt/Ghi chú cố định
            <textarea rows={5} name="notes" placeholder="Yêu cầu về giọng văn, độ dài, cấu trúc, nguồn tham khảo, phần cần tránh..." />
          </label>

          <label className="inline-check">
            <input name="active" type="checkbox" defaultChecked />
            Bật workflow
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              Lưu workflow
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Workflow đã lưu</h2>
        <div className="admin-table">
          <div className="admin-table-row workflow-row admin-table-head">
            <span>Tên</span>
            <span>Chuyên mục</span>
            <span>Lịch</span>
            <span>Trạng thái</span>
            <span>Lần chạy</span>
            <span>Thao tác</span>
          </div>
          {workflows.length === 0 ? (
            <div className="admin-table-row workflow-row">
              <span>Chưa có workflow nào.</span>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div className="admin-table-row workflow-row" key={workflow.id}>
                <div>
                  <strong>{workflow.name}</strong>
                  <p className="table-note">{workflow.topicTemplate}</p>
                </div>
                <span>{workflow.categorySlug}</span>
                <span>{workflow.scheduleRule}</span>
                <span className={workflow.active ? "status-badge status-published" : "status-badge status-archived"}>
                  {workflow.active ? "Đang bật" : "Đang tắt"}
                </span>
                <span className="muted-text">
                  {workflow.lastRunAt ? `${workflow.lastRunAt.slice(0, 10)} · ${workflow.lastRunStatus ?? "done"}` : "Chưa chạy"}
                </span>
                <div className="row-actions">
                  <form action={runAiWorkflowAction.bind(null, workflow.id)}>
                    <button className="secondary-action small-action" type="submit" disabled={!workflow.active}>
                      Chạy thử
                    </button>
                  </form>
                  <form action={toggleAiWorkflowAction.bind(null, workflow.id)}>
                    <button className="secondary-action small-action" type="submit">
                      {workflow.active ? "Tắt" : "Bật"}
                    </button>
                  </form>
                  {allowDelete ? (
                    <form action={deleteAiWorkflowAction.bind(null, workflow.id)}>
                      <button className="danger-button" type="submit">
                        Xóa
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="admin-panel">
        <h2>AI jobs gần đây</h2>
        <div className="admin-table">
          <div className="admin-table-row ai-row admin-table-head">
            <span>Chủ đề</span>
            <span>Chuyên mục</span>
            <span>Nguồn</span>
            <span>Trạng thái</span>
            <span>Bài viết</span>
          </div>
          {jobs.length === 0 ? (
            <div className="admin-table-row ai-row">
              <span>Chưa có job nào.</span>
            </div>
          ) : (
            jobs.map((job) => (
              <div className="admin-table-row ai-row" key={job.id}>
                <strong>{job.topic}</strong>
                <span>{job.categorySlug}</span>
                <span>{job.source === "openai" ? "OpenAI" : "Mock"}</span>
                <span className={job.status === "failed" ? "status-badge status-archived" : "status-badge status-published"}>
                  {job.status === "failed" ? "Lỗi" : "Đã tạo"}
                </span>
                {job.postId ? <Link href={`/admin/posts/${job.postId}/edit`}>Mở bài</Link> : <span>{job.error}</span>}
              </div>
            ))
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
