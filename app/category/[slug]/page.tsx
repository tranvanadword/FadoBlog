import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PostCard } from "@/components/site/PostCard";
import { getCategoryBySlug, listCategories, listPostsByCategory } from "@/lib/content";
import { buildSeo } from "@/lib/seo";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return buildSeo({
      title: "Không tìm thấy",
      description: "Chuyên mục không tồn tại.",
      path: "/",
    });
  }

  return buildSeo({
    title: category.name,
    description: category.description,
    path: "/category/" + category.slug,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const posts = await listPostsByCategory(slug);

  return (
    <>
      <Header />
      <main className="page-shell">
        <p className="eyebrow">Chuyên mục</p>
        <h1>{category.name}</h1>
        <p className="page-intro">{category.description}</p>
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
