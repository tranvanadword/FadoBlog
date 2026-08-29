import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/site/ContactForm";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getPageBySlug, listPublishedPages } from "@/lib/content";
import { renderArticleHtml, toPlainText } from "@/lib/html";
import { buildSeo } from "@/lib/seo";

type StaticPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const pages = await listPublishedPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return buildSeo({
      title: "Không tìm thấy",
      description: "Trang nội dung không tồn tại hoặc chưa được xuất bản.",
      path: "/",
    });
  }

  return buildSeo({
    title: page.seoTitle || page.title,
    description: page.metaDescription || toPlainText(page.content).slice(0, 150),
    path: "/page/" + page.slug,
  });
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="page-shell narrow-page">
        <p className="eyebrow">Trang tĩnh</p>
        <h1>{page.title}</h1>
        <article className="article-content" dangerouslySetInnerHTML={{ __html: renderArticleHtml(page.content) }} />
        {page.slug === "lien-he" ? <ContactForm /> : null}
      </main>
      <Footer />
    </>
  );
}
