"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { createTag, deleteTag, updateTag, type TagInput } from "@/lib/content";
import { toSlug } from "@/lib/slug";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanManageTags() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

function parseTagInput(formData: FormData): TagInput {
  const name = readString(formData, "name");
  const slug = readString(formData, "slug") || toSlug(name);

  if (!name || !slug) {
    throw new Error("Tên tag và slug là bắt buộc.");
  }

  return { name, slug };
}

function revalidateTagSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts/new");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/tag/${slug}`);
}

export async function createTagAction(formData: FormData) {
  await ensureCanManageTags();
  const tag = await createTag(parseTagInput(formData));
  revalidateTagSurfaces(tag.slug);
  redirect("/admin/tags");
}

export async function updateTagAction(id: string, formData: FormData) {
  await ensureCanManageTags();
  const input = parseTagInput(formData);
  const tag = await updateTag(id, input);
  revalidateTagSurfaces(tag?.slug ?? input.slug);
  redirect("/admin/tags");
}

export async function deleteTagAction(id: string) {
  await ensureCanManageTags();
  await deleteTag(id);
  revalidateTagSurfaces();
  redirect("/admin/tags");
}
