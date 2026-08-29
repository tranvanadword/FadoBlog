"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allowedPageStatuses, canDeleteContent, canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { createPage, deletePage, updatePage, type StaticPageInput } from "@/lib/content";
import { toSlug } from "@/lib/slug";
import type { PostStatus } from "@/lib/types";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanManagePages() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

async function readStatus(formData: FormData) {
  const status = readString(formData, "status") as PostStatus;
  const allowed = allowedPageStatuses(await getCurrentAdminRole());
  return allowed.includes(status) ? status : "pending_review";
}

async function parsePageInput(formData: FormData): Promise<StaticPageInput> {
  const title = readString(formData, "title");
  const slug = readString(formData, "slug") || toSlug(title);
  const content = readString(formData, "content");

  if (!title || !slug || !content) {
    throw new Error("Tiêu đề, slug và nội dung là bắt buộc.");
  }

  return {
    title,
    slug,
    content,
    status: await readStatus(formData),
    seoTitle: readString(formData, "seoTitle"),
    metaDescription: readString(formData, "metaDescription"),
  };
}

function revalidatePageSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pages");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/page/${slug}`);
}

export async function createPageAction(formData: FormData) {
  await ensureCanManagePages();
  const input = await parsePageInput(formData);
  const page = await createPage(input);
  revalidatePageSurfaces(page.slug);
  redirect("/admin/pages");
}

export async function updatePageAction(id: string, formData: FormData) {
  await ensureCanManagePages();
  const input = await parsePageInput(formData);
  const page = await updatePage(id, input);
  revalidatePageSurfaces(page?.slug ?? input.slug);
  redirect("/admin/pages");
}

export async function deletePageAction(id: string) {
  await ensureCanManagePages();
  if (!canDeleteContent(await getCurrentAdminRole())) redirect("/admin/pages?error=permission");

  await deletePage(id);
  revalidatePageSurfaces();
  redirect("/admin/pages");
}
