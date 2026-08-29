import { NextResponse } from "next/server";
import { runDueAiWorkflows } from "@/lib/content";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/security";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const headerSecret = request.headers.get("x-cron-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return secret === headerSecret || secret === bearer;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`ai-scheduled:ip:${ip}`, 10, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Bạn gọi endpoint quá nhanh." }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET chưa được cấu hình." }, { status: 503, headers: rateLimitHeaders(limit) });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(limit) });
  }

  const results = await runDueAiWorkflows();

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      ran: results.length,
      results: results.map((result) => ({
        workflowId: result.workflow.id,
        workflowName: result.workflow.name,
        status: result.status,
        postId: result.postId,
        error: result.error,
      })),
    },
    { headers: rateLimitHeaders(limit) },
  );
}

export async function POST(request: Request) {
  return GET(request);
}
