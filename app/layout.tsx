import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";
import { buildSeo } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildSeo({
    title: settings.defaultSeoTitle,
    description: settings.defaultMetaDescription,
    settings,
  });
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
