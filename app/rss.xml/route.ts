import { getSiteSettings, listPublishedPosts } from "@/lib/content";
import { absoluteUrl, escapeXml, rssDate } from "@/lib/seo";

export async function GET() {
  const [posts, settings] = await Promise.all([listPublishedPosts(), getSiteSettings()]);
  const items = posts
    .map((post) => {
      const link = absoluteUrl("/post/" + post.slug, settings);

      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid>${escapeXml(link)}</guid>`,
        `<pubDate>${rssDate(post.publishedAt)}</pubDate>`,
        `<description>${escapeXml(post.excerpt)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(settings.siteName)}</title>`,
    `<link>${escapeXml(absoluteUrl("/", settings))}</link>`,
    `<description>${escapeXml(settings.defaultMetaDescription)}</description>`,
    `<lastBuildDate>${rssDate()}</lastBuildDate>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
