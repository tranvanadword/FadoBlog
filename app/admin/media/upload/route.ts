import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { adminSessionCookie, canManageMedia, getCurrentAdminUserFromToken } from "@/lib/auth";
import { createMedia } from "@/lib/content";
import { deleteMediaObject, mediaUrlForKey, saveMediaObject } from "@/lib/media-storage";
import { toSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const maxUploadSize = 5 * 1024 * 1024;

function mediaRedirect(request: NextRequest, error?: string) {
  const url = new URL("/admin/media", request.url);
  if (error) url.searchParams.set("error", error);
  return Response.redirect(url, 303);
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanUpload(request: NextRequest) {
  const token = request.cookies.get(adminSessionCookie)?.value;
  const user = await getCurrentAdminUserFromToken(token);
  return Boolean(user && canManageMedia(user.role));
}

export async function POST(request: NextRequest) {
  if (!(await ensureCanUpload(request))) {
    return Response.redirect(new URL("/admin?error=permission", request.url), 303);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const altText = readString(formData, "altText");

  if (!(file instanceof File) || file.size === 0) {
    return mediaRedirect(request, "missing");
  }

  if (!allowedTypes.has(file.type)) {
    return mediaRedirect(request, "type");
  }

  if (file.size > maxUploadSize) {
    return mediaRedirect(request, "size");
  }

  const extension = allowedTypes.get(file.type);
  const safeName = toSlug(file.name.replace(/\.[^.]+$/, "")) || "upload";
  const filename = `${safeName}-${Date.now()}.${extension}`;
  const key = `uploads/${filename}`;

  try {
    await saveMediaObject({ key, file, contentType: file.type });
  } catch (error) {
    console.error("Failed to save media object", error);
    return mediaRedirect(request, "storage");
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
    return mediaRedirect(request, "library");
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/posts/new");
  return mediaRedirect(request);
}
