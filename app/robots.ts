import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/"],
    },
    sitemap: absoluteUrl("/sitemap.xml", settings),
  };
}
