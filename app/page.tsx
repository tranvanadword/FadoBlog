import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PostCard } from "@/components/site/PostCard";
import { Sidebar } from "@/components/site/Sidebar";
import { getSiteSettings, listCategories, listPublishedPosts } from "@/lib/content";
import { buildSeo } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildSeo({
    title: settings.defaultSeoTitle,
    description: settings.defaultMetaDescription,
    path: "/",
    settings,
  });
}

export default async function HomePage() {
  const [posts, categories, settings] = await Promise.all([listPublishedPosts(), listCategories(), getSiteSettings()]);
  const featured = posts[0];
  const latestPosts = posts.slice(1);

  return (
    <>
      <Header />
      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">Tin tức và nội dung được quản lý bằng CMS</p>
            <h1>{settings.siteName}</h1>
            <p>{settings.siteDescription}</p>
            <a className="primary-action" href="#latest">
              Đọc bài mới
            </a>
          </div>
        </section>
        <section className="content-layout" id="latest">
          <div>
            <div className="section-heading">
              <p className="eyebrow">Mới cập nhật</p>
              <h2>Bài viết nổi bật</h2>
            </div>
            {featured ? <PostCard post={featured} featured /> : null}
            <div className="post-grid compact-grid">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
          <Sidebar />
        </section>
        <section className="topics" aria-labelledby="topics-title">
          <div>
            <p className="eyebrow">Danh mục</p>
            <h2 id="topics-title">Chủ đề đang viết</h2>
          </div>
          <div className="topic-list">
            {categories.map((category) => (
              <a key={category.id} href={"/category/" + category.slug}>
                {category.name}
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
