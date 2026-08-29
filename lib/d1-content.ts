import { getD1Database } from "./cloudflare";
import { defaultSiteSettings } from "./local-content-store";
import { toPlainText } from "./html";
import { toSlug } from "./slug";
import type {
  AnalyticsSummary,
  AuditLog,
  Category,
  ContactMessage,
  ContactMessageStatus,
  MediaItem,
  NavigationLink,
  PageView,
  Post,
  PostRevision,
  PostRevisionSnapshot,
  PostStatus,
  SiteSettings,
  StaticPage,
  Tag,
} from "./types";

type PostInputShape = {
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

type PageInputShape = {
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  seoTitle?: string;
  metaDescription?: string;
};

export type D1ContentStore = {
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(input: SiteSettings): Promise<SiteSettings>;
  listCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryById(categoryId: string): Promise<Category | undefined>;
  createCategory(input: { name: string; slug: string; description: string }): Promise<Category>;
  updateCategory(categoryId: string, input: { name: string; slug: string; description: string }): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;
  listTags(): Promise<Tag[]>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  getTagById(tagId: string): Promise<Tag | undefined>;
  createTag(input: { name: string; slug: string }): Promise<Tag>;
  updateTag(tagId: string, input: { name: string; slug: string }): Promise<Tag>;
  deleteTag(tagId: string): Promise<void>;
  listPublishedPosts(): Promise<Post[]>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  listPostsByCategory(slug: string): Promise<Post[]>;
  listPostsByTag(slug: string): Promise<Post[]>;
  listAdminPosts(): Promise<Post[]>;
  getAdminPostById(postId: string): Promise<Post | undefined>;
  createPost(input: PostInputShape): Promise<Post>;
  updatePost(postId: string, input: PostInputShape): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  listPostRevisions(postId: string): Promise<PostRevision[]>;
  getPostRevisionById(revisionId: string): Promise<PostRevision | undefined>;
  listPages(): Promise<StaticPage[]>;
  listPublishedPages(): Promise<StaticPage[]>;
  getPageBySlug(slug: string): Promise<StaticPage | undefined>;
  getAdminPageById(pageId: string): Promise<StaticPage | undefined>;
  createPage(input: PageInputShape): Promise<StaticPage>;
  updatePage(pageId: string, input: PageInputShape): Promise<StaticPage>;
  deletePage(pageId: string): Promise<void>;
  listMedia(): Promise<MediaItem[]>;
  createMedia(input: { url: string; altText: string; type: string; size: number; uploadedBy?: string }): Promise<MediaItem>;
  deleteMedia(mediaId: string): Promise<void>;
  listContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(input: { name: string; email: string; subject: string; message: string }): Promise<ContactMessage>;
  updateContactMessageStatus(messageId: string, status: ContactMessageStatus): Promise<ContactMessage>;
  recordPageView(input: { path: string; postId?: string; referrer?: string; userAgent?: string }): Promise<PageView>;
  listPageViews(limit?: number): Promise<PageView[]>;
  recordAuditLog(input: {
    actorId?: string;
    actorEmail?: string;
    action: AuditLog["action"];
    entityType: string;
    entityId?: string;
    summary: string;
  }): Promise<AuditLog>;
  listAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
};

type D1PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: PostStatus;
  coverImage: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryDescription: string | null;
  authorName: string | null;
  tagNames: string | null;
  createdAt: string;
  updatedAt: string;
};

type D1PageRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  seoTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function normalizeTagNames(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function estimateReadingMinutes(content: string) {
  const words = toPlainText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function requireResult<T>(value: T | undefined, message: string): T {
  if (!value) throw new Error(message);
  return value;
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

function mapCategory(row: { id: string; name: string; slug: string; description: string | null }): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
  };
}

function mapTag(row: { id: string; name: string; slug: string }): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

function mapPost(row: D1PostRow): Post {
  const category = {
    id: row.categoryId ?? "cat-default",
    name: row.categoryName ?? "FadoBlog",
    slug: row.categorySlug ?? "tin-tuc",
    description: row.categoryDescription ?? "",
  };

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content,
    status: row.status,
    coverImage: row.coverImage ?? "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    category,
    author: row.authorName ?? "FadoBlog Editorial",
    readingMinutes: estimateReadingMinutes(row.content),
    publishedAt: row.publishedAt ? row.publishedAt.slice(0, 10) : "",
    seoTitle: row.seoTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    tags: row.tagNames ? row.tagNames.split(",").filter(Boolean) : [],
  };
}

function mapPage(row: D1PageRow): StaticPage {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    status: row.status,
    seoTitle: row.seoTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    updatedAt: row.updatedAt.slice(0, 10),
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

function mapRevision(row: { id: string; postId: string; contentSnapshot: string; editorId: string | null; createdAt: string }): PostRevision {
  return {
    id: row.id,
    postId: row.postId,
    snapshot: parseJson<PostRevisionSnapshot>(row.contentSnapshot, {
      title: "",
      slug: "",
      excerpt: "",
      content: row.contentSnapshot,
      status: "draft",
      coverImage: "",
      categorySlug: "cong-nghe",
      tags: [],
    }),
    editorId: row.editorId ?? undefined,
    createdAt: row.createdAt,
  };
}

function normalizeContactStatus(status: string): ContactMessageStatus {
  return status === "read" || status === "archived" ? status : "new";
}

function mapContact(row: { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string }): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: normalizeContactStatus(row.status),
    createdAt: row.createdAt,
  };
}

function mapPageView(row: { id: string; path: string; postId: string | null; referrer: string | null; userAgent: string | null; createdAt: string }): PageView {
  return {
    id: row.id,
    path: row.path,
    postId: row.postId ?? undefined,
    referrer: row.referrer ?? undefined,
    userAgent: row.userAgent ?? undefined,
    createdAt: row.createdAt,
  };
}

function mapAuditLog(row: {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: AuditLog["action"];
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
}): AuditLog {
  return {
    id: row.id,
    actorId: row.actorId ?? undefined,
    actorEmail: row.actorEmail ?? undefined,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId ?? undefined,
    summary: row.summary,
    createdAt: row.createdAt,
  };
}

async function getCategoryIdBySlug(db: D1Database, slug: string) {
  const category = await db.prepare("SELECT id FROM Category WHERE slug = ?").bind(slug).first<{ id: string }>();
  return category?.id ?? null;
}

async function getAdminUserId(db: D1Database) {
  const user = await db.prepare("SELECT id FROM User WHERE role = 'admin' AND active = 1 ORDER BY createdAt ASC LIMIT 1").first<{ id: string }>();
  return user?.id ?? null;
}

async function upsertPostTags(db: D1Database, postId: string, tags: string[]) {
  await db.prepare("DELETE FROM PostTag WHERE postId = ?").bind(postId).run();

  for (const name of normalizeTagNames(tags)) {
    const slug = toSlug(name);
    let tag = await db.prepare("SELECT id FROM Tag WHERE slug = ?").bind(slug).first<{ id: string }>();
    if (!tag) {
      tag = { id: id("tag") };
      await db.prepare("INSERT INTO Tag (id, name, slug) VALUES (?, ?, ?)").bind(tag.id, name, slug).run();
    } else {
      await db.prepare("UPDATE Tag SET name = ? WHERE id = ?").bind(name, tag.id).run();
    }
    await db.prepare("INSERT OR IGNORE INTO PostTag (postId, tagId) VALUES (?, ?)").bind(postId, tag.id).run();
  }
}

async function queryPosts(db: D1Database, whereSql = "", binds: unknown[] = []) {
  const sql = `
    SELECT
      Post.*,
      Category.id AS categoryId,
      Category.name AS categoryName,
      Category.slug AS categorySlug,
      Category.description AS categoryDescription,
      User.name AS authorName,
      GROUP_CONCAT(Tag.name) AS tagNames
    FROM Post
    LEFT JOIN Category ON Category.id = Post.categoryId
    LEFT JOIN User ON User.id = Post.authorId
    LEFT JOIN PostTag ON PostTag.postId = Post.id
    LEFT JOIN Tag ON Tag.id = PostTag.tagId
    ${whereSql}
    GROUP BY Post.id
    ORDER BY COALESCE(Post.publishedAt, Post.createdAt) DESC, Post.updatedAt DESC
  `;
  const result = await db.prepare(sql).bind(...binds).all<D1PostRow>();
  return result.results.map(mapPost);
}

export async function getD1Store(): Promise<D1ContentStore | null> {
  const db = await getD1Database();
  if (!db) return null;

  const store: D1ContentStore = {
    async getSiteSettings() {
      const row = await db.prepare("SELECT valueJson FROM Setting WHERE key = 'site-settings' OR key = 'site' ORDER BY key DESC LIMIT 1").first<{
        valueJson: string;
      }>();
      return normalizeSiteSettings(parseJson<Partial<SiteSettings>>(row?.valueJson, {}));
    },
    async updateSiteSettings(input: SiteSettings) {
      const settings = normalizeSiteSettings(input);
      await db
        .prepare(
          "INSERT INTO Setting (key, valueJson, updatedAt) VALUES ('site-settings', ?, ?) ON CONFLICT(key) DO UPDATE SET valueJson = excluded.valueJson, updatedAt = excluded.updatedAt",
        )
        .bind(JSON.stringify(settings), now())
        .run();
      return settings;
    },
    async listCategories() {
      const result = await db.prepare("SELECT id, name, slug, description FROM Category ORDER BY name ASC").all<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
      }>();
      return result.results.map(mapCategory);
    },
    async getCategoryBySlug(slug: string) {
      const row = await db.prepare("SELECT id, name, slug, description FROM Category WHERE slug = ?").bind(slug).first<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
      }>();
      return row ? mapCategory(row) : undefined;
    },
    async getCategoryById(categoryId: string) {
      const row = await db.prepare("SELECT id, name, slug, description FROM Category WHERE id = ?").bind(categoryId).first<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
      }>();
      return row ? mapCategory(row) : undefined;
    },
    async createCategory(input: { name: string; slug: string; description: string }) {
      const category = { id: id("category"), name: input.name, slug: normalizeSlug(input.slug), description: input.description };
      await db.prepare("INSERT INTO Category (id, name, slug, description) VALUES (?, ?, ?, ?)").bind(category.id, category.name, category.slug, category.description).run();
      return category;
    },
    async updateCategory(categoryId: string, input: { name: string; slug: string; description: string }) {
      await db
        .prepare("UPDATE Category SET name = ?, slug = ?, description = ?, updatedAt = ? WHERE id = ?")
        .bind(input.name, normalizeSlug(input.slug), input.description, now(), categoryId)
        .run();
      return requireResult(await this.getCategoryById(categoryId), "Khong tim thay danh muc sau khi cap nhat.");
    },
    async deleteCategory(categoryId: string) {
      const fallback = await db.prepare("SELECT id FROM Category WHERE id != ? ORDER BY name ASC LIMIT 1").bind(categoryId).first<{ id: string }>();
      await db.prepare("UPDATE Post SET categoryId = ? WHERE categoryId = ?").bind(fallback?.id ?? null, categoryId).run();
      await db.prepare("DELETE FROM Category WHERE id = ?").bind(categoryId).run();
    },
    async listTags() {
      const result = await db.prepare("SELECT id, name, slug FROM Tag ORDER BY name ASC").all<{ id: string; name: string; slug: string }>();
      return result.results.map(mapTag);
    },
    async getTagBySlug(slug: string) {
      const row = await db.prepare("SELECT id, name, slug FROM Tag WHERE slug = ?").bind(slug).first<{ id: string; name: string; slug: string }>();
      return row ? mapTag(row) : undefined;
    },
    async getTagById(tagId: string) {
      const row = await db.prepare("SELECT id, name, slug FROM Tag WHERE id = ?").bind(tagId).first<{ id: string; name: string; slug: string }>();
      return row ? mapTag(row) : undefined;
    },
    async createTag(input: { name: string; slug: string }) {
      const tag = { id: id("tag"), name: input.name, slug: normalizeSlug(input.slug) };
      await db.prepare("INSERT INTO Tag (id, name, slug) VALUES (?, ?, ?)").bind(tag.id, tag.name, tag.slug).run();
      return tag;
    },
    async updateTag(tagId: string, input: { name: string; slug: string }) {
      await db.prepare("UPDATE Tag SET name = ?, slug = ? WHERE id = ?").bind(input.name, normalizeSlug(input.slug), tagId).run();
      return requireResult(await this.getTagById(tagId), "Khong tim thay tag sau khi cap nhat.");
    },
    async deleteTag(tagId: string) {
      await db.prepare("DELETE FROM Tag WHERE id = ?").bind(tagId).run();
    },
    listPublishedPosts() {
      return queryPosts(db, "WHERE Post.status = 'published'");
    },
    async getPostBySlug(slug: string) {
      const posts = await queryPosts(db, "WHERE Post.slug = ? AND Post.status = 'published'", [slug]);
      return posts[0];
    },
    listPostsByCategory(slug: string) {
      return queryPosts(db, "WHERE Post.status = 'published' AND Category.slug = ?", [slug]);
    },
    listPostsByTag(slug: string) {
      return queryPosts(db, "WHERE Post.status = 'published' AND Tag.slug = ?", [slug]);
    },
    listAdminPosts() {
      return queryPosts(db);
    },
    async getAdminPostById(postId: string) {
      const posts = await queryPosts(db, "WHERE Post.id = ?", [postId]);
      return posts[0];
    },
    async createPost(input: {
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
    }) {
      const postId = id("post");
      const categoryId = await getCategoryIdBySlug(db, input.categorySlug);
      const authorId = await getAdminUserId(db);
      const publishedAt = input.status === "published" ? now() : null;
      await db
        .prepare(
          "INSERT INTO Post (id, title, slug, excerpt, content, status, coverImage, seoTitle, metaDescription, publishedAt, categoryId, authorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          postId,
          input.title,
          normalizeSlug(input.slug),
          input.excerpt,
          input.content,
          input.status,
          input.coverImage,
          input.seoTitle ?? null,
          input.metaDescription ?? null,
          publishedAt,
          categoryId,
          authorId,
        )
        .run();
      await upsertPostTags(db, postId, input.tags);
      return requireResult(await this.getAdminPostById(postId), "Khong tim thay bai viet sau khi tao.");
    },
    async updatePost(postId: string, input: {
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
    }) {
      const existing = await this.getAdminPostById(postId);
      if (existing) {
        await db
          .prepare("INSERT INTO PostRevision (id, postId, contentSnapshot, editorId) VALUES (?, ?, ?, ?)")
          .bind(id("revision"), postId, JSON.stringify(postToRevisionSnapshot(existing)), null)
          .run();
      }

      const categoryId = await getCategoryIdBySlug(db, input.categorySlug);
      const publishedAt = input.status === "published" ? existing?.publishedAt || now() : null;
      await db
        .prepare(
          "UPDATE Post SET title = ?, slug = ?, excerpt = ?, content = ?, status = ?, coverImage = ?, seoTitle = ?, metaDescription = ?, publishedAt = ?, categoryId = ?, updatedAt = ? WHERE id = ?",
        )
        .bind(
          input.title,
          normalizeSlug(input.slug),
          input.excerpt,
          input.content,
          input.status,
          input.coverImage,
          input.seoTitle ?? null,
          input.metaDescription ?? null,
          publishedAt,
          categoryId,
          now(),
          postId,
        )
        .run();
      await upsertPostTags(db, postId, input.tags);
      return requireResult(await this.getAdminPostById(postId), "Khong tim thay bai viet sau khi cap nhat.");
    },
    async deletePost(postId: string) {
      await db.prepare("DELETE FROM Post WHERE id = ?").bind(postId).run();
    },
    async listPostRevisions(postId: string) {
      const result = await db
        .prepare("SELECT id, postId, contentSnapshot, editorId, createdAt FROM PostRevision WHERE postId = ? ORDER BY createdAt DESC")
        .bind(postId)
        .all<{ id: string; postId: string; contentSnapshot: string; editorId: string | null; createdAt: string }>();
      return result.results.map(mapRevision);
    },
    async getPostRevisionById(revisionId: string) {
      const row = await db.prepare("SELECT id, postId, contentSnapshot, editorId, createdAt FROM PostRevision WHERE id = ?").bind(revisionId).first<{
        id: string;
        postId: string;
        contentSnapshot: string;
        editorId: string | null;
        createdAt: string;
      }>();
      return row ? mapRevision(row) : undefined;
    },
    async listPages() {
      const result = await db.prepare("SELECT id, title, slug, content, status, seoTitle, metaDescription, updatedAt FROM Page ORDER BY updatedAt DESC").all<D1PageRow>();
      return result.results.map(mapPage);
    },
    async listPublishedPages() {
      const result = await db
        .prepare("SELECT id, title, slug, content, status, seoTitle, metaDescription, updatedAt FROM Page WHERE status = 'published' ORDER BY updatedAt DESC")
        .all<D1PageRow>();
      return result.results.map(mapPage);
    },
    async getPageBySlug(slug: string) {
      const row = await db
        .prepare("SELECT id, title, slug, content, status, seoTitle, metaDescription, updatedAt FROM Page WHERE slug = ? AND status = 'published'")
        .bind(slug)
        .first<D1PageRow>();
      return row ? mapPage(row) : undefined;
    },
    async getAdminPageById(pageId: string) {
      const row = await db.prepare("SELECT id, title, slug, content, status, seoTitle, metaDescription, updatedAt FROM Page WHERE id = ?").bind(pageId).first<D1PageRow>();
      return row ? mapPage(row) : undefined;
    },
    async createPage(input: { title: string; slug: string; content: string; status: PostStatus; seoTitle?: string; metaDescription?: string }) {
      const pageId = id("page");
      await db
        .prepare("INSERT INTO Page (id, title, slug, content, status, seoTitle, metaDescription, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(pageId, input.title, normalizeSlug(input.slug), input.content, input.status, input.seoTitle ?? null, input.metaDescription ?? null, now())
        .run();
      return requireResult(await this.getAdminPageById(pageId), "Khong tim thay page sau khi tao.");
    },
    async updatePage(pageId: string, input: { title: string; slug: string; content: string; status: PostStatus; seoTitle?: string; metaDescription?: string }) {
      await db
        .prepare("UPDATE Page SET title = ?, slug = ?, content = ?, status = ?, seoTitle = ?, metaDescription = ?, updatedAt = ? WHERE id = ?")
        .bind(input.title, normalizeSlug(input.slug), input.content, input.status, input.seoTitle ?? null, input.metaDescription ?? null, now(), pageId)
        .run();
      return requireResult(await this.getAdminPageById(pageId), "Khong tim thay page sau khi cap nhat.");
    },
    async deletePage(pageId: string) {
      await db.prepare("DELETE FROM Page WHERE id = ?").bind(pageId).run();
    },
    async listMedia() {
      const result = await db.prepare("SELECT id, url, altText, type, size, uploadedBy, createdAt FROM Media ORDER BY createdAt DESC").all<{
        id: string;
        url: string;
        altText: string | null;
        type: string;
        size: number | null;
        uploadedBy: string | null;
        createdAt: string;
      }>();
      return result.results.map((item): MediaItem => ({
        id: item.id,
        url: item.url,
        altText: item.altText ?? "",
        type: item.type,
        size: item.size ?? 0,
        uploadedBy: item.uploadedBy ?? undefined,
        createdAt: item.createdAt.slice(0, 10),
      }));
    },
    async createMedia(input: { url: string; altText: string; type: string; size: number; uploadedBy?: string }) {
      const media: MediaItem = { id: id("media"), ...input, createdAt: today() };
      await db
        .prepare("INSERT INTO Media (id, url, altText, type, size, uploadedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(media.id, media.url, media.altText, media.type, media.size, media.uploadedBy ?? null, now())
        .run();
      return media;
    },
    async deleteMedia(mediaId: string) {
      await db.prepare("DELETE FROM Media WHERE id = ?").bind(mediaId).run();
    },
    async listContactMessages() {
      const result = await db.prepare("SELECT id, name, email, subject, message, status, createdAt FROM ContactMessage ORDER BY createdAt DESC").all<{
        id: string;
        name: string;
        email: string;
        subject: string;
        message: string;
        status: string;
        createdAt: string;
      }>();
      return result.results.map(mapContact);
    },
    async createContactMessage(input: { name: string; email: string; subject: string; message: string }) {
      const messageId = id("contact");
      await db
        .prepare("INSERT INTO ContactMessage (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)")
        .bind(messageId, input.name, input.email, input.subject, input.message)
        .run();
      return requireResult((await this.listContactMessages()).find((message) => message.id === messageId), "Khong tim thay tin nhan sau khi tao.");
    },
    async updateContactMessageStatus(messageId: string, status: ContactMessageStatus) {
      await db.prepare("UPDATE ContactMessage SET status = ?, updatedAt = ? WHERE id = ?").bind(status, now(), messageId).run();
      return requireResult((await this.listContactMessages()).find((message) => message.id === messageId), "Khong tim thay tin nhan sau khi cap nhat.");
    },
    async recordPageView(input: { path: string; postId?: string; referrer?: string; userAgent?: string }) {
      const view: PageView = {
        id: id("view"),
        path: input.path,
        postId: input.postId,
        referrer: input.referrer,
        userAgent: input.userAgent,
        createdAt: now(),
      };
      await db
        .prepare("INSERT INTO PageView (id, path, postId, referrer, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(view.id, view.path, view.postId ?? null, view.referrer ?? null, view.userAgent ?? null, view.createdAt)
        .run();
      return view;
    },
    async listPageViews(limit = 5000) {
      const result = await db
        .prepare("SELECT id, path, postId, referrer, userAgent, createdAt FROM PageView ORDER BY createdAt DESC LIMIT ?")
        .bind(limit)
        .all<{ id: string; path: string; postId: string | null; referrer: string | null; userAgent: string | null; createdAt: string }>();
      return result.results.map(mapPageView);
    },
    async recordAuditLog(input: {
      actorId?: string;
      actorEmail?: string;
      action: AuditLog["action"];
      entityType: string;
      entityId?: string;
      summary: string;
    }) {
      const log: AuditLog = {
        id: id("audit"),
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary.slice(0, 260),
        createdAt: now(),
      };
      await db
        .prepare("INSERT INTO AuditLog (id, actorId, actorEmail, action, entityType, entityId, summary, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(log.id, log.actorId ?? null, log.actorEmail ?? null, log.action, log.entityType, log.entityId ?? null, log.summary, log.createdAt)
        .run();
      return log;
    },
    async listAuditLogs(limit = 200) {
      const result = await db
        .prepare("SELECT id, actorId, actorEmail, action, entityType, entityId, summary, createdAt FROM AuditLog ORDER BY createdAt DESC LIMIT ?")
        .bind(limit)
        .all<{
          id: string;
          actorId: string | null;
          actorEmail: string | null;
          action: AuditLog["action"];
          entityType: string;
          entityId: string | null;
          summary: string;
          createdAt: string;
        }>();
      return result.results.map(mapAuditLog);
    },
    async getAnalyticsSummary(): Promise<AnalyticsSummary> {
      const [posts, views] = await Promise.all([this.listAdminPosts(), this.listPageViews(5000)]);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const postViewCounts = new Map<string, number>();
      const referrerCounts = new Map<string, number>();
      for (const view of views) {
        if (view.postId) postViewCounts.set(view.postId, (postViewCounts.get(view.postId) ?? 0) + 1);
        let source = "Direct";
        if (view.referrer) {
          try {
            source = new URL(view.referrer).hostname.replace(/^www\./, "");
          } catch {
            source = "Other";
          }
        }
        referrerCounts.set(source, (referrerCounts.get(source) ?? 0) + 1);
      }

      return {
        totalViews: views.length,
        postViews: views.filter((view) => Boolean(view.postId)).length,
        todayViews: views.filter((view) => new Date(view.createdAt).getTime() >= todayStart.getTime()).length,
        last7DaysViews: views.filter((view) => new Date(view.createdAt).getTime() >= weekStart.getTime()).length,
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
        recentViews: views.slice(0, 12),
        referrers: Array.from(referrerCounts.entries())
          .map(([source, count]) => ({ source, views: count }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 8),
      };
    },
  };

  return store;
}
