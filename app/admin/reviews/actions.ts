"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canPublish, getCurrentAdminRole, getCurrentAdminUser } from "@/lib/auth";
import { getAdminPostById, recordAuditLog, updatePost } from "@/lib/content";
import type { PostStatus } from "@/lib/types";

async function changeReviewStatus(id: string, status: PostStatus) {
  const user = await getCurrentAdminUser();
  if (!canPublish(await getCurrentAdminRole())) redirect("/admin?error=permission");

  const post = await getAdminPostById(id);
  if (!post) redirect("/admin/reviews");

  const updated = await updatePost(id, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status,
    coverImage: post.coverImage,
    categorySlug: post.category.slug,
    seoTitle: post.seoTitle,
    metaDescription: post.metaDescription,
    tags: post.tags,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/reviews");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/category/${post.category.slug}`);
  revalidatePath(`/post/${updated?.slug ?? post.slug}`);

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: status === "published" ? "post.approve" : "post.return_draft",
    entityType: "post",
    entityId: id,
    summary: `${status === "published" ? "Xuất bản" : "Trả nháp"} bài viết: ${post.title}`,
  });
}

export async function approvePostAction(id: string) {
  await changeReviewStatus(id, "published");
  redirect("/admin/reviews");
}

export async function returnToDraftAction(id: string) {
  await changeReviewStatus(id, "draft");
  redirect("/admin/reviews");
}
