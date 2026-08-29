import Link from "next/link";
import { listCategories, listPublishedPosts, listTags } from "@/lib/content";

export async function Sidebar() {
  const [categories, tags, popularPosts] = await Promise.all([
    listCategories(),
    listTags(),
    listPublishedPosts().then((posts) => posts.slice(0, 3)),
  ]);

  return (
    <aside className="sidebar" aria-label="Nội dung phụ">
      <section>
        <h2>Chuyên mục</h2>
        <div className="chip-list">
          {categories.map((category) => (
            <Link key={category.id} href={"/category/" + category.slug}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2>Tags</h2>
        <div className="chip-list">
          {tags.slice(0, 12).map((tag) => (
            <Link key={tag.id} href={"/tag/" + tag.slug}>
              {tag.name}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2>Bài nổi bật</h2>
        <ol className="popular-list">
          {popularPosts.map((post) => (
            <li key={post.id}>
              <Link href={"/post/" + post.slug}>{post.title}</Link>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
