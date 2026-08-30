"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canDeleteContent, canManageMedia, getCurrentAdminRole } from "@/lib/auth";
import { deleteMedia, listMedia } from "@/lib/content";
import { deleteMediaObject, mediaKeyFromUrl } from "@/lib/media-storage";

async function ensureCanManageMedia() {
  if (!canManageMedia(await getCurrentAdminRole())) redirect("/admin?error=permission");
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
