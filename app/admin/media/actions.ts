"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canDeleteContent, canManageMedia, getCurrentAdminRole } from "@/lib/auth";
import { createMedia, deleteMedia, listMedia } from "@/lib/content";
import { deleteMediaObject, mediaKeyFromUrl, mediaUrlForKey, saveMediaObject } from "@/lib/media-storage";
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
  const key = `uploads/${filename}`;

  try {
    await saveMediaObject({ key, file, contentType: file.type });
  } catch (error) {
    console.error("Failed to save media object", error);
    redirect("/admin/media?error=storage");
  }

  try {
    await createMedia({
      url: mediaUrlForKey(key),
      altText,
      type: file.type,
      size: file.size,
      uploadedBy: "FadoBlog Admin",
    });
  } catch (error) {
    console.error("Failed to create media record", error);
    await deleteMediaObject(key);
    redirect("/admin/media?error=library");
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/posts/new");
  redirect("/admin/media");
}

export async function deleteMediaAction(id: string) {
  await ensureCanManageMedia();
  if (!canDeleteContent(await getCurrentAdminRole())) redirect("/admin/media?error=permission");

  const media = (await listMedia()).find((item) => item.id === id);
  await deleteMedia(id);

  const mediaKey = media ? mediaKeyFromUrl(media.url) : null;
  if (mediaKey) await deleteMediaObject(mediaKey);

  revalidatePath("/admin/media");
  revalidatePath("/admin/posts/new");
  redirect("/admin/media");
}
