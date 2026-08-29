import {
  categories as mockCategories,
  getCategoryBySlug as getMockCategoryBySlug,
  getPostBySlug as getMockPostBySlug,
  getPostsByCategory as getMockPostsByCategory,
  getPublishedPosts as getMockPublishedPosts,
  posts as mockPosts,
} from "./mock-data";
import { getPrismaClient } from "./prisma";
import { generatePostDraft } from "./ai";
import type {
  AiJob,
  AiWorkflow,
  AiWorkflowTargetStatus,
  AiWorkflowTone,
  AuditAction,
  AuditLog,
  Category,
  ContactMessage,
  ContactMessageStatus,
  MediaItem,
  NavigationLink,
  AnalyticsSummary,
  PageView,
  Post,
  PostRevision,
  PostRevisionSnapshot,
  PostStatus,
  SiteSettings,
  StaticPage,
  Tag,
} from "./types";
import { defaultSiteSettings, readLocalContent, writeLocalContent, type LocalContent } from "./local-content-store";
import { toSlug } from "./slug";
import { toPlainText } from "./html";
import { getD1Store } from "./d1-content";

type DbPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: PostStatus;
  coverImage: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  category: Category | null;
  author: { name: string } | null;
  tags: { tag: { name: string } }[];
};

type DbPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  seoTitle: string | null;
  metaDescription: string | null;
  updatedAt: Date;
};

type DbMedia = {
  id: string;
  url: string;
  altText: string | null;
  type: string;
  size: number | null;
  uploadedBy: string | null;
  createdAt: Date;
};

type DbContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
};

type DbPageView = {
  id: string;
  path: string;
  postId: string | null;
  referrer: string | null;
  userAgent: string | null;
  createdAt: Date;
};

type DbAuditLog = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
};

type DbAiWorkflow = {
  id: string;
  name: string;
  promptConfig: unknown;
  autoPublish: boolean;
  scheduleRule: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DbSetting = {
  key: string;
  valueJson: unknown;
  updatedAt: Date;
};

type DbTag = {
  id: string;
  name: string;
  slug: string;
};

type DbPostRevision = {
  id: string;
  postId: string;
  contentSnapshot: string;
  editorId: string | null;
  createdAt: Date;
};

function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function estimateReadingMinutes(content: string) {
  const words = toPlainText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function mapDbPost(post: DbPost): Post {
  const category = post.category ?? mockCategories[0];

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    status: post.status,
    coverImage: post.coverImage ?? "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    category,
    author: post.author?.name ?? "FadoBlog Editorial",
    readingMinutes: estimateReadingMinutes(post.content),
    publishedAt: formatDate(post.publishedAt),
    seoTitle: post.seoTitle ?? undefined,
    metaDescription: post.metaDescription ?? undefined,
    tags: post.tags.map((item) => item.tag.name),
  };
}

function mapDbPage(page: DbPage): StaticPage {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content,
    status: page.status,
    seoTitle: page.seoTitle ?? undefined,
    metaDescription: page.metaDescription ?? undefined,
    updatedAt: page.updatedAt.toISOString().slice(0, 10),
  };
}

function postToRevisionSnapshot(post: Post): PostRevisionSnapshot {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    coverImage: post.coverImage,
    categorySlug: post.category.slug,
    seoTitle: post.seoTitle,
    metaDescription: post.metaDescription,
    tags: post.tags,
  };
}

function parseRevisionSnapshot(value: string): PostRevisionSnapshot {
  try {
    const parsed = JSON.parse(value) as Partial<PostRevisionSnapshot>;
    return {
      title: String(parsed.title ?? ""),
      slug: String(parsed.slug ?? ""),
      excerpt: String(parsed.excerpt ?? ""),
      content: String(parsed.content ?? value),
      status: (parsed.status as PostStatus) ?? "draft",
      coverImage: String(parsed.coverImage ?? ""),
      categorySlug: String(parsed.categorySlug ?? "cong-nghe"),
      seoTitle: parsed.seoTitle ? String(parsed.seoTitle) : undefined,
      metaDescription: parsed.metaDescription ? String(parsed.metaDescription) : undefined,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    };
  } catch {
    return {
      title: "Phiên bản cũ",
      slug: "",
      excerpt: "",
      content: value,
      status: "draft",
      coverImage: "",
      categorySlug: "cong-nghe",
      tags: [],
    };
  }
}

function mapDbPostRevision(revision: DbPostRevision): PostRevision {
  return {
    id: revision.id,
    postId: revision.postId,
    snapshot: parseRevisionSnapshot(revision.contentSnapshot),
    editorId: revision.editorId ?? undefined,
    createdAt: revision.createdAt.toISOString(),
  };
}

function normalizeContactStatus(status: string): ContactMessageStatus {
  return status === "read" || status === "archived" ? status : "new";
}

function mapDbContactMessage(message: DbContactMessage): ContactMessage {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: normalizeContactStatus(message.status),
    createdAt: message.createdAt.toISOString(),
  };
}

function mapDbPageView(view: DbPageView): PageView {
  return {
    id: view.id,
    path: view.path,
    postId: view.postId ?? undefined,
    referrer: view.referrer ?? undefined,
    userAgent: view.userAgent ?? undefined,
    createdAt: view.createdAt.toISOString(),
  };
}

function mapDbAuditLog(log: DbAuditLog): AuditLog {
  return {
    id: log.id,
    actorId: log.actorId ?? undefined,
    actorEmail: log.actorEmail ?? undefined,
    action: log.action as AuditAction,
    entityType: log.entityType,
    entityId: log.entityId ?? undefined,
    summary: log.summary,
    createdAt: log.createdAt.toISOString(),
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);
  return date;
}

function referrerSource(referrer?: string) {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

function buildAnalyticsSummary(posts: Post[], views: PageView[]): AnalyticsSummary {
  const today = startOfToday().getTime();
  const week = sevenDaysAgo().getTime();
  const postViewCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const view of views) {
    if (view.postId) postViewCounts.set(view.postId, (postViewCounts.get(view.postId) ?? 0) + 1);
    const source = referrerSource(view.referrer);
    referrerCounts.set(source, (referrerCounts.get(source) ?? 0) + 1);
  }

  return {
    totalViews: views.length,
    postViews: views.filter((view) => Boolean(view.postId)).length,
    todayViews: views.filter((view) => new Date(view.createdAt).getTime() >= today).length,
    last7DaysViews: views.filter((view) => new Date(view.createdAt).getTime() >= week).length,
    topPosts: posts
      .map((post) => ({
        postId: post.id,
        title: post.title,
        slug: post.slug,
        categoryName: post.category.name,
        views: postViewCounts.get(post.id) ?? 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10),
    recentViews: [...views].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12),
    referrers: Array.from(referrerCounts.entries())
      .map(([source, count]) => ({ source, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
  };
}

function mapDbMedia(media: DbMedia): MediaItem {
  return {
    id: media.id,
    url: media.url,
    altText: media.altText ?? "",
    type: media.type,
    size: media.size ?? 0,
    uploadedBy: media.uploadedBy ?? undefined,
    createdAt: media.createdAt.toISOString().slice(0, 10),
  };
}

function mapDbTag(tag: DbTag): Tag {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

function getWorkflowConfig(workflow: DbAiWorkflow) {
  const config = typeof workflow.promptConfig === "object" && workflow.promptConfig ? workflow.promptConfig : {};

  return {
    topicTemplate: "topicTemplate" in config ? String(config.topicTemplate) : "",
    categorySlug: "categorySlug" in config ? String(config.categorySlug) : "cong-nghe",
    tone:
      "tone" in config && (config.tone === "guide" || config.tone === "review")
        ? (config.tone as AiWorkflowTone)
        : "news",
    notes: "notes" in config ? String(config.notes) : "",
    lastRunAt: "lastRunAt" in config ? String(config.lastRunAt) : undefined,
    lastRunStatus:
      "lastRunStatus" in config && (config.lastRunStatus === "generated" || config.lastRunStatus === "failed")
        ? (config.lastRunStatus as "generated" | "failed")
        : undefined,
    targetStatus:
      "targetStatus" in config && config.targetStatus === "pending_review"
        ? ("pending_review" as AiWorkflowTargetStatus)
        : ("draft" as AiWorkflowTargetStatus),
  };
}

function mapDbAiWorkflow(workflow: DbAiWorkflow): AiWorkflow {
  const config = getWorkflowConfig(workflow);

  return {
    id: workflow.id,
    name: workflow.name,
    ...config,
    scheduleRule: workflow.scheduleRule ?? "",
    active: workflow.active,
    autoPublish: workflow.autoPublish,
    lastRunAt: config.lastRunAt,
    lastRunStatus: config.lastRunStatus,
    createdAt: workflow.createdAt.toISOString().slice(0, 10),
    updatedAt: workflow.updatedAt.toISOString().slice(0, 10),
  };
}

const postInclude = {
  category: true,
  author: { select: { name: true } },
  tags: { include: { tag: true } },
};

function normalizeSiteSettings(settings?: Partial<SiteSettings>): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...(settings ?? {}),
    siteName: settings?.siteName?.trim() || defaultSiteSettings.siteName,
    siteDescription: settings?.siteDescription?.trim() || defaultSiteSettings.siteDescription,
    publicUrl: (settings?.publicUrl?.trim() || process.env.NEXT_PUBLIC_SITE_URL || defaultSiteSettings.publicUrl).replace(/\/$/, ""),
    defaultSeoTitle: settings?.defaultSeoTitle?.trim() || settings?.siteName?.trim() || defaultSiteSettings.defaultSeoTitle,
    defaultMetaDescription:
      settings?.defaultMetaDescription?.trim() || settings?.siteDescription?.trim() || defaultSiteSettings.defaultMetaDescription,
    headerLinks: normalizeNavigationLinks(settings?.headerLinks),
    footerLinks: normalizeNavigationLinks(settings?.footerLinks),
  };
}

function normalizeNavigationLinks(links?: NavigationLink[]) {
  return (links ?? [])
    .map((link, index) => ({
      id: link.id || `nav-${index}`,
      label: link.label.trim(),
      href: link.href.trim(),
      visible: link.visible,
    }))
    .filter((link) => link.label && link.href);
}

function mapDbSiteSettings(setting?: DbSetting | null): SiteSettings {
  const value = typeof setting?.valueJson === "object" && setting.valueJson ? (setting.valueJson as Partial<SiteSettings>) : {};
  return normalizeSiteSettings(value);
}

export async function getSiteSettings() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getSiteSettings();
    return normalizeSiteSettings((await readLocalContent()).settings);
  }

  const setting = await prisma.setting.findUnique({ where: { key: "site-settings" } });
  return mapDbSiteSettings(setting as DbSetting | null);
}

export async function updateSiteSettings(input: SiteSettings) {
  const settings = normalizeSiteSettings(input);
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.updateSiteSettings(settings);
    const content = await readLocalContent();
    await writeLocalContent({ ...content, settings });
    return settings;
  }

  await prisma.setting.upsert({
    where: { key: "site-settings" },
    update: { valueJson: settings },
    create: { key: "site-settings", valueJson: settings },
  });

  return settings;
}

export async function updateSiteNavigation(input: Pick<SiteSettings, "headerLinks" | "footerLinks">) {
  const current = await getSiteSettings();
  return updateSiteSettings({
    ...current,
    headerLinks: normalizeNavigationLinks(input.headerLinks),
    footerLinks: normalizeNavigationLinks(input.footerLinks),
  });
}

export async function listCategories() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listCategories();
    return (await readLocalContent()).categories;
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
  }));
}

export async function getCategoryBySlug(slug: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return (await d1.getCategoryBySlug(slug)) ?? getMockCategoryBySlug(slug);
    const content = await readLocalContent();
    return content.categories.find((category) => category.slug === slug) ?? getMockCategoryBySlug(slug);
  }

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return undefined;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
  };
}

export async function listTags() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listTags();
    return (await readLocalContent()).tags;
  }

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return tags.map((tag) => mapDbTag(tag as DbTag));
}

export async function getTagBySlug(slug: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getTagBySlug(slug);
    return (await readLocalContent()).tags.find((tag) => tag.slug === slug);
  }

  const tag = await prisma.tag.findUnique({ where: { slug } });
  return tag ? mapDbTag(tag as DbTag) : undefined;
}

export async function listPublishedPosts() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listPublishedPosts();
    return (await readLocalContent()).posts.filter((post) => post.status === "published");
  }

  const posts = await prisma.post.findMany({
    where: { status: "published" },
    include: postInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return posts.map((post) => mapDbPost(post as DbPost));
}

export async function getPostBySlug(slug: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return (await d1.getPostBySlug(slug)) ?? getMockPostBySlug(slug);
    const content = await readLocalContent();
    return content.posts.find((post) => post.slug === slug && post.status === "published") ?? getMockPostBySlug(slug);
  }

  const post = await prisma.post.findFirst({
    where: { slug, status: "published" },
    include: postInclude,
  });

  return post ? mapDbPost(post as DbPost) : undefined;
}

export async function listPostsByCategory(slug: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) {
      const posts = await d1.listPostsByCategory(slug);
      return posts.length > 0 ? posts : getMockPostsByCategory(slug);
    }
    const content = await readLocalContent();
    const posts = content.posts.filter((post) => post.status === "published" && post.category.slug === slug);
    return posts.length > 0 ? posts : getMockPostsByCategory(slug);
  }

  const posts = await prisma.post.findMany({
    where: { status: "published", category: { slug } },
    include: postInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return posts.map((post) => mapDbPost(post as DbPost));
}

export async function listPostsByTag(slug: string) {
  const prisma = getPrismaClient();
  const tag = await getTagBySlug(slug);
  if (!tag) return [];

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listPostsByTag(slug);
    const content = await readLocalContent();
    return content.posts.filter((post) => post.status === "published" && post.tags.includes(tag.name));
  }

  const posts = await prisma.post.findMany({
    where: { status: "published", tags: { some: { tag: { slug } } } },
    include: postInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return posts.map((post) => mapDbPost(post as DbPost));
}

export async function listAdminPosts() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listAdminPosts();
    return (await readLocalContent()).posts;
  }

  const posts = await prisma.post.findMany({
    include: postInclude,
    orderBy: { updatedAt: "desc" },
  });

  return posts.map((post) => mapDbPost(post as DbPost));
}

export async function getAdminPostById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return (await d1.getAdminPostById(id)) ?? mockPosts.find((post) => post.id === id);
    return (await readLocalContent()).posts.find((post) => post.id === id) ?? mockPosts.find((post) => post.id === id);
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });

  return post ? mapDbPost(post as DbPost) : undefined;
}

export type PostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  coverImage: string;
  categorySlug: string;
  seoTitle?: string;
  metaDescription?: string;
  tags: string[];
};

export type TagInput = {
  name: string;
  slug: string;
};

export type CategoryInput = {
  name: string;
  slug: string;
  description: string;
};

export type StaticPageInput = {
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  seoTitle?: string;
  metaDescription?: string;
};

export type AiDraftWorkflowInput = {
  workflowId?: string;
  topic: string;
  categorySlug: string;
  tone: AiWorkflowTone;
  notes: string;
  targetStatus: AiWorkflowTargetStatus;
};

export type AiWorkflowInput = {
  name: string;
  topicTemplate: string;
  categorySlug: string;
  tone: AiWorkflowTone;
  notes: string;
  targetStatus: AiWorkflowTargetStatus;
  scheduleRule: string;
  active: boolean;
  autoPublish: boolean;
};

export type ScheduledWorkflowRun = {
  workflow: AiWorkflow;
  status: "generated" | "failed" | "skipped";
  postId?: string;
  error?: string;
};

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function normalizeTagNames(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function publishDateForStatus(status: PostStatus, current?: string) {
  if (status !== "published") return null;
  return current ? new Date(current) : new Date();
}

export async function createPost(input: PostInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.createPost({ ...input, slug });
    const content = await readLocalContent();
    const category = content.categories.find((item) => item.slug === input.categorySlug) ?? content.categories[0];
    const post: Post = {
      id: `post-${Date.now()}`,
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      coverImage: input.coverImage,
      category,
      author: "FadoBlog Admin",
      readingMinutes: estimateReadingMinutes(input.content),
      publishedAt: input.status === "published" ? new Date().toISOString().slice(0, 10) : "",
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
      tags: normalizeTagNames(input.tags),
    };
    await writeLocalContent({ ...content, posts: [post, ...content.posts] });
    return post;
  }

  const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });

  const tagNames = normalizeTagNames(input.tags);
  const tagConnections = await Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { slug: toSlug(name) },
        update: { name },
        create: { name, slug: toSlug(name) },
      });
      return { tagId: tag.id };
    }),
  );

  const post = await prisma.post.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      coverImage: input.coverImage,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
      publishedAt: publishDateForStatus(input.status),
      categoryId: category?.id,
      authorId: admin?.id,
      tags: { create: tagConnections },
    },
    include: postInclude,
  });

  return mapDbPost(post as DbPost);
}

export async function updatePost(id: string, input: PostInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.updatePost(id, { ...input, slug });
    const content = await readLocalContent();
    const existingPost = content.posts.find((post) => post.id === id);
    const category = content.categories.find((item) => item.slug === input.categorySlug) ?? content.categories[0];
    const posts = content.posts.map((post) =>
      post.id === id
        ? {
            ...post,
            title: input.title,
            slug,
            excerpt: input.excerpt,
            content: input.content,
            status: input.status,
            coverImage: input.coverImage,
            category,
            readingMinutes: estimateReadingMinutes(input.content),
            publishedAt: input.status === "published" ? post.publishedAt || new Date().toISOString().slice(0, 10) : "",
            seoTitle: input.seoTitle,
            metaDescription: input.metaDescription,
            tags: normalizeTagNames(input.tags),
          }
        : post,
    );
    const revision = existingPost
      ? {
          id: `revision-${Date.now()}`,
          postId: id,
          snapshot: postToRevisionSnapshot(existingPost),
          editorId: "env-admin",
          editorName: "Admin",
          createdAt: new Date().toISOString(),
        }
      : undefined;
    await writeLocalContent({ ...content, posts, postRevisions: revision ? [revision, ...content.postRevisions] : content.postRevisions });
    return posts.find((post) => post.id === id);
  }

  const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
  const existing = await prisma.post.findUnique({ where: { id }, include: postInclude });

  if (existing) {
    const mappedExisting = mapDbPost(existing as DbPost);
    await prisma.postRevision.create({
      data: {
        postId: id,
        contentSnapshot: JSON.stringify(postToRevisionSnapshot(mappedExisting)),
        editorId: existing.authorId,
      },
    });
  }

  await prisma.postTag.deleteMany({ where: { postId: id } });
  const tagNames = normalizeTagNames(input.tags);
  const tagConnections = await Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { slug: toSlug(name) },
        update: { name },
        create: { name, slug: toSlug(name) },
      });
      return { tagId: tag.id };
    }),
  );

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      coverImage: input.coverImage,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
      publishedAt: publishDateForStatus(input.status, existing?.publishedAt?.toISOString().slice(0, 10)),
      categoryId: category?.id,
      tags: { create: tagConnections },
    },
    include: postInclude,
  });

  return mapDbPost(post as DbPost);
}

export async function listPostRevisions(postId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listPostRevisions(postId);
    const content = await readLocalContent();
    return content.postRevisions.filter((revision) => revision.postId === postId);
  }

  const revisions = await prisma.postRevision.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
  });

  return revisions.map((revision) => mapDbPostRevision(revision as DbPostRevision));
}

export async function getPostRevisionById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getPostRevisionById(id);
    const content = await readLocalContent();
    return content.postRevisions.find((revision) => revision.id === id);
  }

  const revision = await prisma.postRevision.findUnique({ where: { id } });
  return revision ? mapDbPostRevision(revision as DbPostRevision) : undefined;
}

export async function restorePostRevision(postId: string, revisionId: string) {
  const revision = await getPostRevisionById(revisionId);
  if (!revision || revision.postId !== postId) return undefined;

  return updatePost(postId, {
    title: revision.snapshot.title,
    slug: revision.snapshot.slug,
    excerpt: revision.snapshot.excerpt,
    content: revision.snapshot.content,
    status: revision.snapshot.status,
    coverImage: revision.snapshot.coverImage,
    categorySlug: revision.snapshot.categorySlug,
    seoTitle: revision.snapshot.seoTitle,
    metaDescription: revision.snapshot.metaDescription,
    tags: revision.snapshot.tags,
  });
}

export async function getTagById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getTagById(id);
    return (await readLocalContent()).tags.find((tag) => tag.id === id);
  }

  const tag = await prisma.tag.findUnique({ where: { id } });
  return tag ? mapDbTag(tag as DbTag) : undefined;
}

export async function createTag(input: TagInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.createTag({ ...input, slug });
    const content = await readLocalContent();
    const tag: Tag = { id: `tag-${Date.now()}`, name: input.name, slug };
    await writeLocalContent({ ...content, tags: [...content.tags, tag] });
    return tag;
  }

  const tag = await prisma.tag.create({ data: { name: input.name, slug } });
  return mapDbTag(tag as DbTag);
}

export async function updateTag(id: string, input: TagInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.updateTag(id, { ...input, slug });
    const content = await readLocalContent();
    const existing = content.tags.find((tag) => tag.id === id);
    if (!existing) return undefined;
    const tag: Tag = { ...existing, name: input.name, slug };
    const tags = content.tags.map((item) => (item.id === id ? tag : item));
    const posts = content.posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => (postTag === existing.name ? tag.name : postTag)),
    }));
    await writeLocalContent({ ...content, tags, posts });
    return tag;
  }

  const tag = await prisma.tag.update({ where: { id }, data: { name: input.name, slug } });
  return mapDbTag(tag as DbTag);
}

export async function deleteTag(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.deleteTag(id);
    const content = await readLocalContent();
    const existing = content.tags.find((tag) => tag.id === id);
    const tags = content.tags.filter((tag) => tag.id !== id);
    const posts = existing
      ? content.posts.map((post) => ({ ...post, tags: post.tags.filter((tag) => tag !== existing.name) }))
      : content.posts;
    await writeLocalContent({ ...content, tags, posts });
    return;
  }

  await prisma.tag.delete({ where: { id } });
}

export async function deletePost(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.deletePost(id);
    const content = await readLocalContent();
    await writeLocalContent({ ...content, posts: content.posts.filter((post) => post.id !== id) });
    return;
  }

  await prisma.post.delete({ where: { id } });
}

export async function getCategoryById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getCategoryById(id);
    return (await readLocalContent()).categories.find((category) => category.id === id);
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return undefined;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
  };
}

export async function createCategory(input: CategoryInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.createCategory({ ...input, slug });
    const content = await readLocalContent();
    const category: Category = {
      id: `category-${Date.now()}`,
      name: input.name,
      slug,
      description: input.description,
    };
    await writeLocalContent({ ...content, categories: [...content.categories, category] });
    return category;
  }

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
  };
}

export async function updateCategory(id: string, input: CategoryInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.updateCategory(id, { ...input, slug });
    const content = await readLocalContent();
    const existing = content.categories.find((category) => category.id === id);
    if (!existing) return undefined;

    const category: Category = {
      ...existing,
      name: input.name,
      slug,
      description: input.description,
    };
    const categories = content.categories.map((item) => (item.id === id ? category : item));
    const posts = content.posts.map((post) => (post.category.id === id ? { ...post, category } : post));
    await writeLocalContent({ ...content, categories, posts });
    return category;
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description,
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
  };
}

export async function deleteCategory(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.deleteCategory(id);
    const content = await readLocalContent();
    const categories = content.categories.filter((category) => category.id !== id);
    const fallbackCategory = categories[0] ?? mockCategories[0];
    const posts = content.posts.map((post) => (post.category.id === id ? { ...post, category: fallbackCategory } : post));
    await writeLocalContent({ ...content, categories: categories.length ? categories : [fallbackCategory], posts });
    return;
  }

  const fallbackCategory = await prisma.category.findFirst({ where: { id: { not: id } }, orderBy: { name: "asc" } });
  if (fallbackCategory) {
    await prisma.post.updateMany({
      where: { categoryId: id },
      data: { categoryId: fallbackCategory.id },
    });
  }

  await prisma.category.delete({ where: { id } });
}

export async function listPages() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listPages();
    return (await readLocalContent()).pages;
  }

  const pages = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  return pages.map((page) => mapDbPage(page as DbPage));
}

export async function listPublishedPages() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listPublishedPages();
    return (await readLocalContent()).pages.filter((page) => page.status === "published");
  }

  const pages = await prisma.page.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
  });
  return pages.map((page) => mapDbPage(page as DbPage));
}

export async function getPageBySlug(slug: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getPageBySlug(slug);
    return (await readLocalContent()).pages.find((page) => page.slug === slug && page.status === "published");
  }

  const page = await prisma.page.findFirst({ where: { slug, status: "published" } });
  return page ? mapDbPage(page as DbPage) : undefined;
}

export async function getAdminPageById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getAdminPageById(id);
    return (await readLocalContent()).pages.find((page) => page.id === id);
  }

  const page = await prisma.page.findUnique({ where: { id } });
  return page ? mapDbPage(page as DbPage) : undefined;
}

export async function createPage(input: StaticPageInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.createPage({ ...input, slug });
    const content = await readLocalContent();
    const page: StaticPage = {
      id: `page-${Date.now()}`,
      title: input.title,
      slug,
      content: input.content,
      status: input.status,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    await writeLocalContent({ ...content, pages: [page, ...content.pages] });
    return page;
  }

  const page = await prisma.page.create({
    data: {
      title: input.title,
      slug,
      content: input.content,
      status: input.status,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
    },
  });

  return mapDbPage(page as DbPage);
}

export async function updatePage(id: string, input: StaticPageInput) {
  const prisma = getPrismaClient();
  const slug = normalizeSlug(input.slug);

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.updatePage(id, { ...input, slug });
    const content = await readLocalContent();
    const pages = content.pages.map((page) =>
      page.id === id
        ? {
            ...page,
            title: input.title,
            slug,
            content: input.content,
            status: input.status,
            seoTitle: input.seoTitle,
            metaDescription: input.metaDescription,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        : page,
    );
    await writeLocalContent({ ...content, pages });
    return pages.find((page) => page.id === id);
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      content: input.content,
      status: input.status,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
    },
  });

  return mapDbPage(page as DbPage);
}

export async function deletePage(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.deletePage(id);
    const content = await readLocalContent();
    await writeLocalContent({ ...content, pages: content.pages.filter((page) => page.id !== id) });
    return;
  }

  await prisma.page.delete({ where: { id } });
}

export async function listAiWorkflows() {
  const prisma = getPrismaClient();
  if (!prisma) return (await readLocalContent()).aiWorkflows;

  const workflows = await prisma.aiWorkflow.findMany({ orderBy: { updatedAt: "desc" } });
  return workflows.map((workflow) => mapDbAiWorkflow(workflow as DbAiWorkflow));
}

export async function createAiWorkflow(input: AiWorkflowInput) {
  const prisma = getPrismaClient();
  const now = new Date().toISOString().slice(0, 10);

  if (!prisma) {
    const content = await readLocalContent();
    const workflow: AiWorkflow = {
      id: `ai-workflow-${Date.now()}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await writeLocalContent({ ...content, aiWorkflows: [workflow, ...content.aiWorkflows] });
    return workflow;
  }

  const workflow = await prisma.aiWorkflow.create({
    data: {
      name: input.name,
      promptConfig: {
        topicTemplate: input.topicTemplate,
        categorySlug: input.categorySlug,
        tone: input.tone,
        notes: input.notes,
        targetStatus: input.targetStatus,
        lastRunAt: null,
        lastRunStatus: null,
      },
      autoPublish: input.autoPublish,
      scheduleRule: input.scheduleRule,
      active: input.active,
    },
  });

  return mapDbAiWorkflow(workflow as DbAiWorkflow);
}

export async function updateAiWorkflow(id: string, input: AiWorkflowInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const content = await readLocalContent();
    const workflows = content.aiWorkflows.map((workflow) =>
      workflow.id === id ? { ...workflow, ...input, updatedAt: new Date().toISOString().slice(0, 10) } : workflow,
    );
    await writeLocalContent({ ...content, aiWorkflows: workflows });
    return workflows.find((workflow) => workflow.id === id);
  }

  const workflow = await prisma.aiWorkflow.update({
    where: { id },
    data: {
      name: input.name,
      promptConfig: {
        topicTemplate: input.topicTemplate,
        categorySlug: input.categorySlug,
        tone: input.tone,
        notes: input.notes,
        targetStatus: input.targetStatus,
      },
      autoPublish: input.autoPublish,
      scheduleRule: input.scheduleRule,
      active: input.active,
    },
  });

  return mapDbAiWorkflow(workflow as DbAiWorkflow);
}

export async function toggleAiWorkflow(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const content = await readLocalContent();
    const workflows = content.aiWorkflows.map((workflow) =>
      workflow.id === id
        ? { ...workflow, active: !workflow.active, updatedAt: new Date().toISOString().slice(0, 10) }
        : workflow,
    );
    await writeLocalContent({ ...content, aiWorkflows: workflows });
    return workflows.find((workflow) => workflow.id === id);
  }

  const existing = await prisma.aiWorkflow.findUnique({ where: { id } });
  if (!existing) return undefined;

  const workflow = await prisma.aiWorkflow.update({
    where: { id },
    data: { active: !existing.active },
  });

  return mapDbAiWorkflow(workflow as DbAiWorkflow);
}

export async function deleteAiWorkflow(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const content = await readLocalContent();
    await writeLocalContent({ ...content, aiWorkflows: content.aiWorkflows.filter((workflow) => workflow.id !== id) });
    return;
  }

  await prisma.aiWorkflow.delete({ where: { id } });
}

async function markAiWorkflowRun(id: string, status: "generated" | "failed") {
  const prisma = getPrismaClient();
  const lastRunAt = new Date().toISOString();

  if (!prisma) {
    const content = await readLocalContent();
    const aiWorkflows = content.aiWorkflows.map((workflow) =>
      workflow.id === id
        ? {
            ...workflow,
            lastRunAt,
            lastRunStatus: status,
            updatedAt: lastRunAt.slice(0, 10),
          }
        : workflow,
    );
    await writeLocalContent({ ...content, aiWorkflows });
    return;
  }

  const existing = await prisma.aiWorkflow.findUnique({ where: { id } });
  const promptConfig =
    typeof existing?.promptConfig === "object" && existing.promptConfig
      ? (existing.promptConfig as Record<string, unknown>)
      : {};

  await prisma.aiWorkflow.update({
    where: { id },
    data: {
      promptConfig: {
        ...promptConfig,
        lastRunAt,
        lastRunStatus: status,
      },
    },
  });
}

function scheduledTimeToday(now: Date, timeText: string) {
  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const scheduled = new Date(now);
  scheduled.setHours(Number.isFinite(hour) ? hour : 8, Number.isFinite(minute) ? minute : 0, 0, 0);
  return scheduled;
}

function scheduledWeeklyDate(now: Date, dayName: string, timeText: string) {
  const dayIndex: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const targetDay = dayIndex[dayName] ?? 1;
  const scheduled = scheduledTimeToday(now, timeText);
  scheduled.setDate(now.getDate() - ((now.getDay() - targetDay + 7) % 7));
  return scheduled;
}

export function isAiWorkflowDue(workflow: AiWorkflow, now = new Date()) {
  if (!workflow.active || workflow.scheduleRule === "manual") return false;

  const lastRunAt = workflow.lastRunAt ? new Date(workflow.lastRunAt) : undefined;
  const dailyMatch = workflow.scheduleRule.match(/^daily-(\d{2}:\d{2})$/);

  if (dailyMatch) {
    const scheduled = scheduledTimeToday(now, dailyMatch[1]);
    return now >= scheduled && (!lastRunAt || lastRunAt < scheduled);
  }

  const weeklyMatch = workflow.scheduleRule.match(/^weekly-([a-z]+)-(\d{2}:\d{2})$/);
  if (weeklyMatch) {
    const scheduled = scheduledWeeklyDate(now, weeklyMatch[1], weeklyMatch[2]);
    return now >= scheduled && (!lastRunAt || lastRunAt < scheduled);
  }

  return false;
}

export async function runSavedAiWorkflow(id: string) {
  const workflow = (await listAiWorkflows()).find((item) => item.id === id);
  if (!workflow || !workflow.active) throw new Error("Workflow không tồn tại hoặc đang tắt.");

  try {
    const result = await runAiDraftWorkflow({
      workflowId: workflow.id,
      topic: workflow.topicTemplate,
      categorySlug: workflow.categorySlug,
      tone: workflow.tone,
      notes: workflow.notes,
      targetStatus: workflow.targetStatus,
    });
    await markAiWorkflowRun(workflow.id, "generated");
    return result;
  } catch (error) {
    await markAiWorkflowRun(workflow.id, "failed");
    throw error;
  }
}

export async function runDueAiWorkflows(now = new Date()): Promise<ScheduledWorkflowRun[]> {
  const workflows = await listAiWorkflows();
  const dueWorkflows = workflows.filter((workflow) => isAiWorkflowDue(workflow, now));

  const results: ScheduledWorkflowRun[] = [];

  for (const workflow of dueWorkflows) {
    try {
      const result = await runSavedAiWorkflow(workflow.id);
      results.push({ workflow, status: "generated", postId: result.post.id });
    } catch (error) {
      results.push({
        workflow,
        status: "failed",
        error: error instanceof Error ? error.message : "Không chạy được workflow.",
      });
    }
  }

  return results;
}

export async function listAiJobs() {
  const prisma = getPrismaClient();
  if (!prisma) return (await readLocalContent()).aiJobs;

  const jobs = await prisma.aiJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return jobs.map(
    (job): AiJob => ({
      id: job.id,
      workflowId: job.workflowId ?? undefined,
      topic: job.topic,
      categorySlug:
        typeof job.inputJson === "object" && job.inputJson && "categorySlug" in job.inputJson
          ? String(job.inputJson.categorySlug)
          : "",
      tone:
        typeof job.inputJson === "object" && job.inputJson && "tone" in job.inputJson
          ? (String(job.inputJson.tone) as AiJob["tone"])
          : "news",
      notes:
        typeof job.inputJson === "object" && job.inputJson && "notes" in job.inputJson
          ? String(job.inputJson.notes)
          : "",
      status: job.status === "failed" ? "failed" : "generated",
      source:
        typeof job.outputJson === "object" && job.outputJson && "source" in job.outputJson && job.outputJson.source === "openai"
          ? "openai"
          : "mock",
      postId: job.postId ?? undefined,
      error: job.errorLog ?? undefined,
      createdAt: job.createdAt.toISOString().slice(0, 10),
    }),
  );
}

async function recordLocalAiJob(job: AiJob) {
  const content = await readLocalContent();
  await writeLocalContent({ ...content, aiJobs: [job, ...content.aiJobs].slice(0, 50) });
}

export async function runAiDraftWorkflow(input: AiDraftWorkflowInput) {
  const prisma = getPrismaClient();
  const jobId = `ai-job-${Date.now()}`;

  try {
    const draft = await generatePostDraft(input);
    const slug = draft.slug ? normalizeSlug(draft.slug) : toSlug(draft.title);
    const post = await createPost({
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      content: draft.content,
      status: input.targetStatus,
      coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      categorySlug: input.categorySlug,
      seoTitle: draft.seoTitle,
      metaDescription: draft.metaDescription,
      tags: [input.topic],
    });

    const job: AiJob = {
      id: jobId,
      workflowId: input.workflowId,
      topic: input.topic,
      categorySlug: input.categorySlug,
      tone: input.tone,
      notes: input.notes,
      status: "generated",
      source: draft.source,
      postId: post.id,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (prisma) {
      await prisma.aiJob.create({
        data: {
          topic: input.topic,
          status: "generated",
          inputJson: input,
          outputJson: { ...draft, source: draft.source },
          workflowId: input.workflowId,
          postId: post.id,
        },
      });
    } else {
      await recordLocalAiJob(job);
    }

    return { post, job };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được bài nháp AI.";
    const job: AiJob = {
      id: jobId,
      workflowId: input.workflowId,
      topic: input.topic,
      categorySlug: input.categorySlug,
      tone: input.tone,
      notes: input.notes,
      status: "failed",
      source: process.env.OPENAI_API_KEY ? "openai" : "mock",
      error: message,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (prisma) {
      await prisma.aiJob.create({
        data: {
          topic: input.topic,
          status: "failed",
          inputJson: input,
          workflowId: input.workflowId,
          errorLog: message,
        },
      });
    } else {
      await recordLocalAiJob(job);
    }

    throw error;
  }
}

export type MediaInput = {
  url: string;
  altText: string;
  type: string;
  size: number;
  uploadedBy?: string;
};

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type AuditLogInput = {
  actorId?: string;
  actorEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  summary: string;
};

export async function listMedia() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listMedia();
    return (await readLocalContent()).media;
  }

  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  return media.map((item) => mapDbMedia(item as DbMedia));
}

export async function recordAuditLog(input: AuditLogInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.recordAuditLog(input);
    const content = await readLocalContent();
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary.slice(0, 260),
      createdAt: new Date().toISOString(),
    };
    await writeLocalContent({ ...content, auditLogs: [log, ...content.auditLogs].slice(0, 500) });
    return log;
  }

  const log = await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary.slice(0, 260),
    },
  });

  return mapDbAuditLog(log as DbAuditLog);
}

export async function listAuditLogs(limit = 200) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listAuditLogs(limit);
    const content = await readLocalContent();
    return content.auditLogs.slice(0, limit);
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => mapDbAuditLog(log as DbAuditLog));
}

export async function createMedia(input: MediaInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.createMedia(input);
    const content = await readLocalContent();
    const media: MediaItem = {
      id: `media-${Date.now()}`,
      url: input.url,
      altText: input.altText,
      type: input.type,
      size: input.size,
      uploadedBy: input.uploadedBy,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    await writeLocalContent({ ...content, media: [media, ...content.media] });
    return media;
  }

  const media = await prisma.media.create({
    data: {
      url: input.url,
      altText: input.altText,
      type: input.type,
      size: input.size,
      uploadedBy: input.uploadedBy,
    },
  });

  return mapDbMedia(media as DbMedia);
}

export async function deleteMedia(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.deleteMedia(id);
    const content = await readLocalContent();
    await writeLocalContent({ ...content, media: content.media.filter((item) => item.id !== id) });
    return;
  }

  await prisma.media.delete({ where: { id } });
}

export async function listContactMessages() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.listContactMessages();
    return (await readLocalContent()).contactMessages;
  }

  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  return messages.map((message) => mapDbContactMessage(message as DbContactMessage));
}

export async function createContactMessage(input: ContactMessageInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.createContactMessage(input);
    const content = await readLocalContent();
    const message: ContactMessage = {
      id: `contact-${Date.now()}`,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    await writeLocalContent({ ...content, contactMessages: [message, ...content.contactMessages] });
    return message;
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    },
  });

  return mapDbContactMessage(message as DbContactMessage);
}

export async function updateContactMessageStatus(id: string, status: ContactMessageStatus) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.updateContactMessageStatus(id, status);
    const content = await readLocalContent();
    const contactMessages = content.contactMessages.map((message) => (message.id === id ? { ...message, status } : message));
    await writeLocalContent({ ...content, contactMessages });
    return contactMessages.find((message) => message.id === id);
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });

  return mapDbContactMessage(message as DbContactMessage);
}

export type PageViewInput = {
  path: string;
  postId?: string;
  referrer?: string;
  userAgent?: string;
};

export async function recordPageView(input: PageViewInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.recordPageView(input);
    const content = await readLocalContent();
    const view: PageView = {
      id: `view-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      path: input.path,
      postId: input.postId,
      referrer: input.referrer,
      userAgent: input.userAgent,
      createdAt: new Date().toISOString(),
    };
    await writeLocalContent({ ...content, pageViews: [view, ...content.pageViews].slice(0, 5000) });
    return view;
  }

  const view = await prisma.pageView.create({
    data: {
      path: input.path,
      postId: input.postId,
      referrer: input.referrer,
      userAgent: input.userAgent,
    },
  });

  return mapDbPageView(view as DbPageView);
}

export async function getAnalyticsSummary() {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Store();
    if (d1) return d1.getAnalyticsSummary();
    const content = await readLocalContent();
    return buildAnalyticsSummary(content.posts, content.pageViews);
  }

  const [posts, views] = await Promise.all([
    prisma.post.findMany({ include: postInclude, orderBy: { createdAt: "desc" } }),
    prisma.pageView.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
  ]);

  return buildAnalyticsSummary(
    posts.map((post) => mapDbPost(post as DbPost)),
    views.map((view) => mapDbPageView(view as DbPageView)),
  );
}

export async function createBackupSnapshot() {
  const prisma = getPrismaClient();
  const exportedAt = new Date().toISOString();
  const settings = await getSiteSettings();

  if (!prisma) {
    const content = await readLocalContent();
    return {
      metadata: {
        app: "FadoBlog",
        exportedAt,
        source: "local-json",
        siteName: settings.siteName,
      },
      data: content,
    };
  }

  const [categories, tags, posts, pages, media, workflows, jobs, revisions, contactMessages, pageViews, auditLogs] = await Promise.all([
    listCategories(),
    listTags(),
    listAdminPosts(),
    listPages(),
    listMedia(),
    listAiWorkflows(),
    prisma.aiJob.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.postRevision.findMany({ orderBy: { createdAt: "desc" } }),
    listContactMessages(),
    prisma.pageView.findMany({ orderBy: { createdAt: "desc" }, take: 10000 }),
    listAuditLogs(500),
  ]);

  return {
    metadata: {
      app: "FadoBlog",
      exportedAt,
      source: "postgresql",
      siteName: settings.siteName,
    },
    data: {
      categories,
      tags,
      postRevisions: revisions.map((revision) => mapDbPostRevision(revision as DbPostRevision)),
      posts,
      pages,
      aiJobs: jobs.map(
        (job): AiJob => ({
          id: job.id,
          workflowId: job.workflowId ?? undefined,
          topic: job.topic,
          categorySlug:
            typeof job.inputJson === "object" && job.inputJson && "categorySlug" in job.inputJson
              ? String(job.inputJson.categorySlug)
              : "",
          tone:
            typeof job.inputJson === "object" && job.inputJson && "tone" in job.inputJson
              ? (String(job.inputJson.tone) as AiJob["tone"])
              : "news",
          notes:
            typeof job.inputJson === "object" && job.inputJson && "notes" in job.inputJson ? String(job.inputJson.notes) : "",
          status: job.status === "failed" ? "failed" : "generated",
          source:
            typeof job.outputJson === "object" && job.outputJson && "source" in job.outputJson && job.outputJson.source === "openai"
              ? "openai"
              : "mock",
          postId: job.postId ?? undefined,
          error: job.errorLog ?? undefined,
          createdAt: job.createdAt.toISOString(),
        }),
      ),
      aiWorkflows: workflows,
      media,
      contactMessages,
      pageViews: pageViews.map((view) => mapDbPageView(view as DbPageView)),
      auditLogs,
      settings,
    },
  };
}

type BackupSnapshot = {
  metadata?: {
    app?: string;
    exportedAt?: string;
    source?: string;
    siteName?: string;
  };
  data?: Partial<LocalContent>;
};

function arrayOrEmpty<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function restoreLocalBackupSnapshot(snapshot: BackupSnapshot) {
  const prisma = getPrismaClient();
  if (prisma) {
    throw new Error("Restore trực tiếp chỉ đang bật cho local JSON. Với PostgreSQL, hãy import bằng quy trình migration riêng.");
  }

  if (!snapshot || snapshot.metadata?.app !== "FadoBlog" || !snapshot.data) {
    throw new Error("File backup không đúng định dạng FadoBlog.");
  }

  const data = snapshot.data;
  const restored: LocalContent = {
    categories: arrayOrEmpty<Category>(data.categories),
    tags: arrayOrEmpty<Tag>(data.tags),
    postRevisions: arrayOrEmpty<PostRevision>(data.postRevisions),
    posts: arrayOrEmpty<Post>(data.posts),
    pages: arrayOrEmpty<StaticPage>(data.pages),
    aiJobs: arrayOrEmpty<AiJob>(data.aiJobs),
    aiWorkflows: arrayOrEmpty<AiWorkflow>(data.aiWorkflows),
    media: arrayOrEmpty<MediaItem>(data.media),
    contactMessages: arrayOrEmpty<ContactMessage>(data.contactMessages),
    pageViews: arrayOrEmpty<PageView>(data.pageViews),
    auditLogs: arrayOrEmpty<AuditLog>(data.auditLogs).slice(0, 500),
    settings: { ...defaultSiteSettings, ...(data.settings ?? {}) },
  };

  if (restored.categories.length === 0 || restored.posts.length === 0 || restored.pages.length === 0) {
    throw new Error("Backup thiếu dữ liệu tối thiểu: categories, posts hoặc pages.");
  }

  await writeLocalContent(restored);
  return {
    categories: restored.categories.length,
    posts: restored.posts.length,
    pages: restored.pages.length,
    media: restored.media.length,
  };
}
