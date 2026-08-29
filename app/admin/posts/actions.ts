"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allowedPostStatuses, canDeleteContent, getCurrentAdminRole, getCurrentAdminUser } from "@/lib/auth";
import { createPost, deletePost, getAdminPostById, recordAuditLog, restorePostRevision, updatePost, type PostInput } from "@/lib/content";
import { toSlug } from "@/lib/slug";
import type { PostStatus } from "@/lib/types";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function readStatus(formData: FormData) {
  const role = await getCurrentAdminRole();
  const status = readString(formData, "status") as PostStatus;
  const allowed = allowedPostStatuses(role);
  return allowed.includes(status) ? status : "pending_review";
}

function readTags(formData: FormData) {
  return readString(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function parsePostInput(formData: FormData): Promise<PostInput> {
  const title = readString(formData, "title");
  const slug = readString(formData, "slug") || toSlug(title);
  const content = readString(formData, "content");

  if (!title || !slug || !content) {
    throw new Error("Tiêu đề, slug và nội dung là bắt buộc.");
  }

  return {
    title,
    slug,
    excerpt: readString(formData, "excerpt"),
    content,
    status: await readStatus(formData),
    coverImage:
      readString(formData, "mediaCoverImage") ||
      readString(formData, "coverImage") ||
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    categorySlug: readString(formData, "categorySlug") || "cong-nghe",
    seoTitle: readString(formData, "seoTitle"),
    metaDescription: readString(formData, "metaDescription"),
    tags: readTags(formData),
  };
}

function revalidatePostSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/tags");
  revalidatePath("/api/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  if (slug) revalidatePath(`/post/${slug}`);
}

export async function createPostAction(formData: FormData) {
  const input = await parsePostInput(formData);
  const post = await createPost(input);
  const user = await getCurrentAdminUser();
  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: "post.create",
    entityType: "post",
    entityId: post.id,
    summary: `Tạo bài viết: ${post.title}`,
  });
  revalidatePostSurfaces(post.slug);
  revalidatePath(`/category/${post.category.slug}`);
  redirect("/admin/posts");
}

export async function updatePostAction(id: string, formData: FormData) {
  const input = await parsePostInput(formData);
  const post = await updatePost(id, input);
  const user = await getCurrentAdminUser();
  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: "post.update",
    entityType: "post",
    entityId: id,
    summary: `Cập nhật bài viết: ${post?.title ?? input.title}`,
  });
  revalidatePostSurfaces(post?.slug ?? input.slug);
  if (post?.category.slug) revalidatePath(`/category/${post.category.slug}`);
  redirect("/admin/posts");
}

export async function restorePostRevisionAction(postId: string, revisionId: string) {
  const post = await restorePostRevision(postId, revisionId);
  const user = await getCurrentAdminUser();
  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: "post.restore",
    entityType: "post",
    entityId: postId,
    summary: `Khôi phục bài viết: ${post?.title ?? postId}`,
  });
  revalidatePostSurfaces(post?.slug);
  if (post?.category.slug) revalidatePath(`/category/${post.category.slug}`);
  redirect(`/admin/posts/${postId}/edit?restored=1`);
}

export async function deletePostAction(id: string) {
  const user = await getCurrentAdminUser();
  if (!canDeleteContent(await getCurrentAdminRole())) redirect("/admin/posts?error=permission");
  const post = await getAdminPostById(id);

  await deletePost(id);
  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: "post.delete",
    entityType: "post",
    entityId: id,
    summary: `Xóa bài viết: ${post?.title ?? id}`,
  });
  revalidatePostSurfaces();
  redirect("/admin/posts");
}
