export type PostStatus = "draft" | "pending_review" | "scheduled" | "published" | "archived";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  coverImage: string;
  category: Category;
  author: string;
  readingMinutes: number;
  publishedAt: string;
  seoTitle?: string;
  metaDescription?: string;
  tags: string[];
};

export type PostRevisionSnapshot = {
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

export type PostRevision = {
  id: string;
  postId: string;
  snapshot: PostRevisionSnapshot;
  editorId?: string;
  editorName?: string;
  createdAt: string;
};

export type StaticPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  seoTitle?: string;
  metaDescription?: string;
  updatedAt: string;
};

export type AiJobStatus = "queued" | "generated" | "failed";

export type AiJob = {
  id: string;
  workflowId?: string;
  topic: string;
  categorySlug: string;
  tone: "news" | "guide" | "review";
  notes: string;
  status: AiJobStatus;
  source: "mock" | "openai";
  postId?: string;
  error?: string;
  createdAt: string;
};

export type AiWorkflowTone = "news" | "guide" | "review";
export type AiWorkflowTargetStatus = "draft" | "pending_review";

export type AiWorkflow = {
  id: string;
  name: string;
  topicTemplate: string;
  categorySlug: string;
  tone: AiWorkflowTone;
  notes: string;
  targetStatus: AiWorkflowTargetStatus;
  scheduleRule: string;
  active: boolean;
  autoPublish: boolean;
  lastRunAt?: string;
  lastRunStatus?: "generated" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type MediaItem = {
  id: string;
  url: string;
  altText: string;
  type: string;
  size: number;
  uploadedBy?: string;
  createdAt: string;
};

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  publicUrl: string;
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  contactEmail: string;
  headerLinks: NavigationLink[];
  footerLinks: NavigationLink[];
};

export type NavigationLink = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
};

export type ContactMessageStatus = "new" | "read" | "archived";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
};

export type PageView = {
  id: string;
  path: string;
  postId?: string;
  referrer?: string;
  userAgent?: string;
  createdAt: string;
};

export type AnalyticsPostStat = {
  postId: string;
  title: string;
  slug: string;
  categoryName: string;
  views: number;
};

export type AnalyticsSummary = {
  totalViews: number;
  postViews: number;
  todayViews: number;
  last7DaysViews: number;
  topPosts: AnalyticsPostStat[];
  recentViews: PageView[];
  referrers: { source: string; views: number }[];
};

export type AuditAction =
  | "login"
  | "post.create"
  | "post.update"
  | "post.delete"
  | "post.restore"
  | "post.approve"
  | "post.return_draft"
  | "backup.export"
  | "backup.restore";

export type AuditLog = {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  summary: string;
  createdAt: string;
};
