import { getMediaBucket } from "@/lib/cloudflare";

const uploadPrefix = "uploads/";

export function mediaUrlForKey(key: string) {
  return `/${key}`;
}

export function mediaKeyFromUrl(url: string) {
  if (!url.startsWith(`/${uploadPrefix}`)) return null;
  return url.slice(1);
}

function isSafeMediaKey(key: string) {
  return key.startsWith(uploadPrefix) && !key.split("/").some((part) => part === "" || part === "." || part === "..");
}

async function getLocalMediaPath(key: string) {
  const path = await import("node:path");
  return path.join(process.cwd(), "public", key);
}

export async function saveMediaObject({
  key,
  file,
  contentType,
}: {
  key: string;
  file: File;
  contentType: string;
}) {
  const bucket = await getMediaBucket();

  if (bucket) {
    await bucket.put(key, file, {
      httpMetadata: {
        contentType,
      },
    });
    return;
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const localUploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(localUploadDir, { recursive: true });
  await writeFile(await getLocalMediaPath(key), Buffer.from(await file.arrayBuffer()));
}

export async function getMediaObject(key: string) {
  if (!isSafeMediaKey(key)) return null;

  const bucket = await getMediaBucket();
  if (bucket) {
    return bucket.get(key);
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const body = await readFile(await getLocalMediaPath(key)).catch(() => null);
  if (!body) return null;

  return {
    body,
    writeHttpMetadata(headers: Headers) {
      const extension = path.extname(key).toLowerCase();
      const contentType =
        extension === ".jpg" || extension === ".jpeg"
          ? "image/jpeg"
          : extension === ".png"
            ? "image/png"
            : extension === ".webp"
              ? "image/webp"
              : extension === ".gif"
                ? "image/gif"
                : "application/octet-stream";
      headers.set("content-type", contentType);
    },
  };
}

export async function deleteMediaObject(key: string) {
  if (!isSafeMediaKey(key)) return;

  const bucket = await getMediaBucket();
  if (bucket) {
    await bucket.delete(key);
    return;
  }

  const { unlink } = await import("node:fs/promises");
  await unlink(await getLocalMediaPath(key)).catch(() => undefined);
}
