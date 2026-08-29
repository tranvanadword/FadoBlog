"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageStructure, getCurrentAdminRole } from "@/lib/auth";
import { createCategory, deleteCategory, updateCategory, type CategoryInput } from "@/lib/content";
import { toSlug } from "@/lib/slug";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanManageCategories() {
  if (!canManageStructure(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

function parseCategoryInput(formData: FormData): CategoryInput {
  const name = readString(formData, "name");
  const slug = readString(formData, "slug") || toSlug(name);

  if (!name || !slug) {
    throw new Error("Tên chuyên mục và slug là bắt buộc.");
  }

  return {
    name,
    slug,
    description: readString(formData, "description"),
  };
}

function revalidateCategorySurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/posts/new");
  revalidatePath("/api/categories");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/category/${slug}`);
}

export async function createCategoryAction(formData: FormData) {
  await ensureCanManageCategories();
  const input = parseCategoryInput(formData);
  const category = await createCategory(input);
  revalidateCategorySurfaces(category.slug);
  redirect("/admin/categories");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await ensureCanManageCategories();
  const input = parseCategoryInput(formData);
  const category = await updateCategory(id, input);
  revalidateCategorySurfaces(category?.slug ?? input.slug);
  redirect("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await ensureCanManageCategories();
  await deleteCategory(id);
  revalidateCategorySurfaces();
  redirect("/admin/categories");
}
