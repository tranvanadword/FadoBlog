import { getMediaBucket, getMediaKvNamespace } from "@/lib/cloudflare";

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

  const kv = await getMediaKvNamespace();
  if (kv) {
    await kv.put(key, await file.arrayBuffer(), {
      metadata: {
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

  const kv = await getMediaKvNamespace();
  if (kv) {
    const object = await kv.getWithMetadata<{ contentType?: string }>(key, "arrayBuffer");
    if (!object.value) return null;

    return {
      body: object.value,
      writeHttpMetadata(headers: Headers) {
        headers.set("content-type", object.metadata?.contentType ?? contentTypeFromKey(key));
      },
    };
  }

  const { readFile } = await import("node:fs/promises");
  const body = await readFile(await getLocalMediaPath(key)).catch(() => null);
  if (!body) return null;

  return {
    body,
    writeHttpMetadata(headers: Headers) {
      headers.set("content-type", contentTypeFromKey(key));
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

  const kv = await getMediaKvNamespace();
  if (kv) {
    await kv.delete(key);
    return;
  }

  const { unlink } = await import("node:fs/promises");
  await unlink(await getLocalMediaPath(key)).catch(() => undefined);
}

function contentTypeFromKey(key: string) {
  const extension = key.toLowerCase().split(".").pop();

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";

  return "application/octet-stream";
}
