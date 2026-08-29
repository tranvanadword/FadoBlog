"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canDeleteContent, canManageMedia, getCurrentAdminRole } from "@/lib/auth";
import { createMedia, deleteMedia, listMedia } from "@/lib/content";
import { toSlug } from "@/lib/slug";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const maxUploadSize = 5 * 1024 * 1024;

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanManageMedia() {
  if (!canManageMedia(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

export async function uploadMediaAction(formData: FormData) {
  await ensureCanManageMedia();

  const file = formData.get("file");
  const altText = readString(formData, "altText");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/media?error=missing");
  }

  if (!allowedTypes.has(file.type)) {
    redirect("/admin/media?error=type");
  }

  if (file.size > maxUploadSize) {
    redirect("/admin/media?error=size");
  }

  const extension = allowedTypes.get(file.type);
  const safeName = toSlug(file.name.replace(/\.[^.]+$/, "")) || "upload";
  const filename = `${safeName}-${Date.now()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const targetPath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

  await createMedia({
    url: `/uploads/${filename}`,
    altText,
    type: file.type,
    size: file.size,
    uploadedBy: "FadoBlog Admin",
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/posts/new");
  redirect("/admin/media");
}

export async function deleteMediaAction(id: string) {
  await ensureCanManageMedia();
  if (!canDeleteContent(await getCurrentAdminRole())) redirect("/admin/media?error=permission");

  const media = (await listMedia()).find((item) => item.id === id);
  await deleteMedia(id);

  if (media?.url.startsWith("/uploads/")) {
    const targetPath = path.join(process.cwd(), "public", media.url);
    await unlink(targetPath).catch(() => undefined);
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/posts/new");
  redirect("/admin/media");
}
