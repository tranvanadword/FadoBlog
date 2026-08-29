import type { MetadataRoute } from "next";
import { getSiteSettings, listCategories, listPublishedPages, listPublishedPosts, listTags } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, pages, tags, settings] = await Promise.all([
    listPublishedPosts(),
    listCategories(),
    listPublishedPages(),
    listTags(),
    getSiteSettings(),
  ]);

  return [
    {
      url: absoluteUrl("/", settings),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...posts.map((post) => ({
      url: absoluteUrl("/post/" + post.slug, settings),
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl("/category/" + category.slug, settings),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tags.map((tag) => ({
      url: absoluteUrl("/tag/" + tag.slug, settings),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...pages.map((page) => ({
      url: absoluteUrl("/page/" + page.slug, settings),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
