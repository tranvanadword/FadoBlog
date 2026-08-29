import { Bot, FileText, FolderTree, Image, Newspaper, Search, Tags } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  canManageMedia,
  canManageSettings,
  canManageStructure,
  canUseAiWorkflow,
  getCurrentAdminRole,
} from "@/lib/auth";
import { listAiJobs, listAiWorkflows, listCategories, listMedia, listPages, listAdminPosts, listTags } from "@/lib/content";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

function includesQuery(values: string[], query: string) {
  const normalized = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalized));
}

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const role = await getCurrentAdminRole();
  const [posts, pages, categories, tags, media, workflows, jobs] = await Promise.all([
    listAdminPosts(),
    canManageStructure(role) ? listPages() : Promise.resolve([]),
    canManageStructure(role) ? listCategories() : Promise.resolve([]),
    canManageStructure(role) ? listTags() : Promise.resolve([]),
    canManageMedia(role) ? listMedia() : Promise.resolve([]),
    canUseAiWorkflow(role) ? listAiWorkflows() : Promise.resolve([]),
    canUseAiWorkflow(role) ? listAiJobs() : Promise.resolve([]),
  ]);

  const results: SearchResult[] = query
    ? [
        ...posts
          .filter((post) =>
            includesQuery([post.title, post.slug, post.excerpt, post.category.name, post.status, post.author, ...post.tags], query),
          )
          .map((post) => ({
            id: `post-${post.id}`,
            type: "Bài viết",
            title: post.title,
            description: `${post.category.name} · ${post.status} · ${post.publishedAt || "Chưa đăng"}`,
            href: `/admin/posts/${post.id}/edit`,
            icon: Newspaper,
          })),
        ...pages
          .filter((page) => includesQuery([page.title, page.slug, page.content, page.status], query))
          .map((page) => ({
            id: `page-${page.id}`,
            type: "Page",
            title: page.title,
            description: `${page.slug} · ${page.status}`,
            href: `/admin/pages/${page.id}/edit`,
            icon: FileText,
          })),
        ...categories
          .filter((category) => includesQuery([category.name, category.slug, category.description], query))
          .map((category) => ({
            id: `category-${category.id}`,
            type: "Chuyên mục",
            title: category.name,
            description: category.description || category.slug,
            href: `/admin/categories/${category.id}/edit`,
            icon: FolderTree,
          })),
        ...tags
          .filter((tag) => includesQuery([tag.name, tag.slug], query))
          .map((tag) => ({
            id: `tag-${tag.id}`,
            type: "Tag",
            title: tag.name,
            description: tag.slug,
            href: `/admin/tags/${tag.id}/edit`,
            icon: Tags,
          })),
        ...media
          .filter((item) => includesQuery([item.altText, item.url, item.type], query))
          .map((item) => ({
            id: `media-${item.id}`,
            type: "Media",
            title: item.altText || item.url,
            description: `${item.type} · ${Math.round(item.size / 1024)} KB`,
            href: "/admin/media",
            icon: Image,
          })),
        ...workflows
          .filter((workflow) =>
            includesQuery([workflow.name, workflow.topicTemplate, workflow.categorySlug, workflow.scheduleRule, workflow.notes], query),
          )
          .map((workflow) => ({
            id: `workflow-${workflow.id}`,
            type: "AI Workflow",
            title: workflow.name,
            description: `${workflow.categorySlug} · ${workflow.scheduleRule} · ${workflow.active ? "Đang bật" : "Đang tắt"}`,
            href: "/admin/ai-workflows",
            icon: Bot,
          })),
        ...jobs
          .filter((job) => includesQuery([job.topic, job.categorySlug, job.status, job.source, job.notes, job.error ?? ""], query))
          .map((job) => ({
            id: `job-${job.id}`,
            type: "AI Job",
            title: job.topic,
            description: `${job.categorySlug} · ${job.source} · ${job.status}`,
            href: job.postId ? `/admin/posts/${job.postId}/edit` : "/admin/ai-workflows",
            icon: Bot,
          })),
      ].slice(0, 40)
    : [];

  const quickLinks = [
    { label: "Bài viết", href: "/admin/posts", visible: true },
    { label: "Tags", href: "/admin/tags", visible: canManageStructure(role) },
    { label: "Media", href: "/admin/media", visible: canManageMedia(role) },
    { label: "AI Workflow", href: "/admin/ai-workflows", visible: canUseAiWorkflow(role) },
    { label: "Navigation", href: "/admin/navigation", visible: canManageSettings(role) },
  ].filter((link) => link.visible);

  return (
    <AdminLayout title="Tìm kiếm">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Tìm trong CMS</h2>
            <p>Nhập từ khóa để tìm bài viết, page, chuyên mục, tag, media, workflow và AI job.</p>
          </div>
        </div>

        <form action="/admin/search" className="editor-form compact-form">
          <label>
            Từ khóa
            <input name="q" defaultValue={query} placeholder="Ví dụ: công nghệ, workflow, ảnh đại diện..." autoFocus />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button">
              <Search size={17} strokeWidth={1.9} />
              Tìm kiếm
            </button>
          </div>
        </form>
      </section>

      {!query ? (
        <section className="admin-panel">
          <h2>Lối tắt</h2>
          <div className="quick-link-grid">
            {quickLinks.map((link) => (
              <Link key={link.href} className="quick-link-card" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Kết quả</h2>
              <p>
                Tìm thấy <strong>{results.length}</strong> kết quả cho "{query}".
              </p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <Search size={28} strokeWidth={1.7} />
              <strong>Không tìm thấy kết quả phù hợp.</strong>
              <span>Thử từ khóa ngắn hơn hoặc kiểm tra lại chính tả.</span>
            </div>
          ) : (
            <div className="search-results">
              {results.map((result) => {
                const Icon = result.icon;

                return (
                  <Link key={result.id} className="search-result-card" href={result.href}>
                    <span className="search-result-icon">
                      <Icon size={19} strokeWidth={1.9} />
                    </span>
                    <span>
                      <small>{result.type}</small>
                      <strong>{result.title}</strong>
                      <em>{result.description}</em>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </AdminLayout>
  );
}
