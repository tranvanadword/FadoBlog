import Link from "next/link";
import type { Post } from "@/lib/types";

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={featured ? "post-card post-card-featured" : "post-card"}>
      <Link href={"/post/" + post.slug}>
        <img src={post.coverImage} alt={post.title} />
      </Link>
      <div className="post-card-body">
        <p className="post-meta">{post.category.name} · {post.readingMinutes} phút đọc</p>
        <h3><Link href={"/post/" + post.slug}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
      </div>
    </article>
  );
}
