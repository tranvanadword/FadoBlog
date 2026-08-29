import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PostCard } from "@/components/site/PostCard";
import { getSiteSettings, getTagBySlug, listPostsByTag, listTags } from "@/lib/content";
import { buildSeo } from "@/lib/seo";

type TagPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tags = await listTags();
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [tag, settings] = await Promise.all([getTagBySlug(slug), getSiteSettings()]);

  if (!tag) {
    return buildSeo({
      title: "Không tìm thấy",
      description: "Tag không tồn tại.",
      path: "/",
      settings,
    });
  }

  return buildSeo({
    title: "Tag: " + tag.name,
    description: `Các bài viết được gắn tag ${tag.name}.`,
    path: "/tag/" + tag.slug,
    settings,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const [tag, posts] = await Promise.all([getTagBySlug(slug), listPostsByTag(slug)]);

  if (!tag) notFound();

  return (
    <>
      <Header />
      <main className="page-shell">
        <p className="eyebrow">Tag</p>
        <h1>{tag.name}</h1>
        <p className="page-intro">Các bài viết đang được gắn tag này.</p>
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
