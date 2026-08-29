import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ViewTracker } from "@/components/site/ViewTracker";
import { getPostBySlug, getSiteSettings, listPublishedPosts, listTags } from "@/lib/content";
import { renderArticleHtml } from "@/lib/html";
import { buildSeo } from "@/lib/seo";
import { toSlug } from "@/lib/slug";

type PostPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);

  if (!post) {
    return buildSeo({
      title: "Không tìm thấy",
      description: "Bài viết không tồn tại hoặc chưa được xuất bản.",
      path: "/",
      settings,
    });
  }

  return buildSeo({
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: "/post/" + post.slug,
    image: post.coverImage,
    type: "article",
    settings,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, tags] = await Promise.all([getPostBySlug(slug), listTags()]);
  if (!post) notFound();
  const related = (await listPublishedPosts()).filter((item) => item.id !== post.id).slice(0, 2);

  function tagHref(name: string) {
    return "/tag/" + (tags.find((tag) => tag.name === name)?.slug ?? toSlug(name));
  }

  return (
    <>
      <ViewTracker path={`/post/${post.slug}`} postId={post.id} />
      <Header />
      <main className="article-shell">
        <p className="post-meta">
          {post.category.name} · {post.readingMinutes} phút đọc · {post.publishedAt}
        </p>
        <h1>{post.title}</h1>
        <p className="article-excerpt">{post.excerpt}</p>
        <img className="article-cover" src={post.coverImage} alt={post.title} />
        <article className="article-content" dangerouslySetInnerHTML={{ __html: renderArticleHtml(post.content) }} />
        <div className="tag-list">
          {post.tags.map((tag) => (
            <Link key={tag} href={tagHref(tag)}>
              {tag}
            </Link>
          ))}
        </div>
        <section className="related-posts">
          <h2>Bài liên quan</h2>
          <div className="post-grid compact-grid">
            {related.map((item) => (
              <a key={item.id} className="related-link" href={"/post/" + item.slug}>
                {item.title}
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
