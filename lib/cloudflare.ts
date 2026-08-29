type CloudflareBindingStatus = {
  d1: boolean;
  r2: boolean;
};

type CloudflareContext = {
  env?: {
    DB?: D1Database;
    FADOBLOG_MEDIA?: unknown;
  };
};

export async function getCloudflareContextSafe(): Promise<CloudflareContext | null> {
  try {
    const cloudflare = await import("@opennextjs/cloudflare");
    return (await cloudflare.getCloudflareContext({ async: true })) as CloudflareContext;
  } catch {
    return null;
  }
}

export async function getD1Database() {
  if (process.env.FADOBLOG_DATA_BACKEND !== "d1") return null;

  const context = await getCloudflareContextSafe();
  return context?.env?.DB ?? null;
}

export async function getCloudflareBindingStatus(): Promise<CloudflareBindingStatus> {
  try {
    const context = await getCloudflareContextSafe();

    return {
      d1: Boolean(context?.env?.DB),
      r2: Boolean(context?.env?.FADOBLOG_MEDIA),
    };
  } catch {
    return {
      d1: false,
      r2: false,
    };
  }
}
