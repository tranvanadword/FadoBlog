import { NextResponse } from "next/server";
import { recordPageView } from "@/lib/content";
import { getClientIp, isJsonRequest, rateLimit, rateLimitHeaders } from "@/lib/security";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 415 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`analytics:ip:${ip}`, 60, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Ghi nhận lượt xem quá nhanh." }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const path = clean(body?.path);
  const postId = clean(body?.postId);

  if (!path || !path.startsWith("/post/") || path.includes("..")) {
    return NextResponse.json({ error: "Đường dẫn không hợp lệ." }, { status: 400 });
  }

  await recordPageView({
    path: path.slice(0, 300),
    postId: postId || undefined,
    referrer: request.headers.get("referer") ?? undefined,
    userAgent: request.headers.get("user-agent")?.slice(0, 300),
  });

  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(limit) });
}
