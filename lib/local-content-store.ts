import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { categories, posts } from "./mock-data";
import type {
  AiJob,
  AiWorkflow,
  AuditLog,
  Category,
  ContactMessage,
  MediaItem,
  PageView,
  Post,
  PostRevision,
  SiteSettings,
  StaticPage,
  Tag,
} from "./types";

export type LocalContent = {
  categories: Category[];
  tags: Tag[];
  postRevisions: PostRevision[];
  posts: Post[];
  pages: StaticPage[];
  aiJobs: AiJob[];
  aiWorkflows: AiWorkflow[];
  media: MediaItem[];
  contactMessages: ContactMessage[];
  pageViews: PageView[];
  auditLogs: AuditLog[];
  settings: SiteSettings;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "FadoBlog",
  siteDescription: "Tin tức, công nghệ, du lịch, ẩm thực và đời sống từ hệ thống CMS FadoBlog.",
  logoUrl: "",
  publicUrl: "http://localhost:3000",
  defaultSeoTitle: "FadoBlog",
  defaultMetaDescription: "FadoBlog chia sẻ tin tức, công nghệ, du lịch, ẩm thực và đời sống.",
  facebookUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  contactEmail: "hello@fadoblog.local",
  headerLinks: [],
  footerLinks: [],
};

const pages: StaticPage[] = [
  {
    id: "page-about",
    title: "Giới thiệu FadoBlog",
    slug: "gioi-thieu",
    content:
      "FadoBlog là nền tảng tin tức/blog được xây dựng theo hướng CMS hiện đại, có thể quản lý nội dung thủ công và mở rộng workflow AI.",
    status: "published",
    seoTitle: "Giới thiệu FadoBlog",
    metaDescription: "Tìm hiểu về FadoBlog và định hướng phát triển nền tảng nội dung.",
    updatedAt: "2026-08-29",
  },
  {
    id: "page-contact",
    title: "Liên hệ",
    slug: "lien-he",
    content: "Trang liên hệ sẽ được kết nối form và email trong giai đoạn backend.",
    status: "published",
    seoTitle: "Liên hệ FadoBlog",
    metaDescription: "Liên hệ với đội ngũ FadoBlog.",
    updatedAt: "2026-08-29",
  },
  {
    id: "page-privacy",
    title: "Chính sách bảo mật",
    slug: "chinh-sach-bao-mat",
    content: "FadoBlog sẽ cập nhật chính sách bảo mật chi tiết trước khi triển khai production.",
    status: "draft",
    seoTitle: "Chính sách bảo mật",
    metaDescription: "Chính sách bảo mật của FadoBlog.",
    updatedAt: "2026-08-29",
  },
  {
    id: "page-terms",
    title: "Điều khoản sử dụng",
    slug: "dieu-khoan-su-dung",
    content: "FadoBlog sẽ cập nhật điều khoản sử dụng chi tiết trước khi mở đăng ký người dùng.",
    status: "draft",
    seoTitle: "Điều khoản sử dụng",
    metaDescription: "Điều khoản sử dụng FadoBlog.",
    updatedAt: "2026-08-29",
  },
];

const tags: Tag[] = [
  { id: "tag-ai", name: "AI", slug: "ai" },
  { id: "tag-du-lich", name: "Du lịch", slug: "du-lich" },
  { id: "tag-am-thuc", name: "Ẩm thực", slug: "am-thuc" },
  { id: "tag-nang-suat", name: "Năng suất", slug: "nang-suat" },
];

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "content.json");

const initialContent: LocalContent = {
  categories,
  tags,
  postRevisions: [],
  posts,
  pages,
  aiJobs: [],
  aiWorkflows: [],
  media: [],
  contactMessages: [],
  pageViews: [],
  auditLogs: [],
  settings: defaultSiteSettings,
};

export async function readLocalContent() {
  try {
    const raw = await readFile(dataFile, "utf8");
    const content = JSON.parse(raw) as Partial<LocalContent>;
    return {
      categories: content.categories ?? categories,
      tags: content.tags ?? tags,
      postRevisions: content.postRevisions ?? [],
      posts: content.posts ?? posts,
      pages: content.pages ?? pages,
      aiJobs: content.aiJobs ?? [],
      aiWorkflows: content.aiWorkflows ?? [],
      media: content.media ?? [],
      contactMessages: content.contactMessages ?? [],
      pageViews: content.pageViews ?? [],
      auditLogs: content.auditLogs ?? [],
      settings: { ...defaultSiteSettings, ...(content.settings ?? {}) },
    };
  } catch {
    await writeLocalContent(initialContent);
    return initialContent;
  }
}

export async function writeLocalContent(content: LocalContent) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(content, null, 2), "utf8");
}
