import type { SiteSettings } from "./types";

type SeoInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  settings?: SiteSettings;
};

export const siteName = "FadoBlog";

export function getSiteUrl(settings?: SiteSettings) {
  return (settings?.publicUrl || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function absoluteUrl(path = "/", settings?: SiteSettings) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return getSiteUrl(settings) + (path.startsWith("/") ? path : "/" + path);
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function rssDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export function buildSeo({ title, description, path = "/", image, type = "website", settings }: SeoInput) {
  const resolvedSiteName = settings?.siteName || siteName;
  const resolvedTitle = title === resolvedSiteName ? resolvedSiteName : title + " | " + resolvedSiteName;
  const resolvedDescription =
    description ?? settings?.defaultMetaDescription ?? "FadoBlog chia sẻ tin tức, công nghệ, du lịch, ẩm thực và đời sống.";
  const url = absoluteUrl(path, settings);
  const imageUrl = image ? absoluteUrl(image, settings) : undefined;

  return {
    metadataBase: new URL(getSiteUrl(settings)),
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      type,
      url,
      siteName: resolvedSiteName,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
