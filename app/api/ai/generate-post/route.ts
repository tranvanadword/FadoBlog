import { NextResponse } from "next/server";
import { runAiDraftWorkflow } from "@/lib/content";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const result = await runAiDraftWorkflow({
    topic: typeof body.topic === "string" ? body.topic : "FadoBlog",
    categorySlug: typeof body.categorySlug === "string" ? body.categorySlug : "cong-nghe",
    tone: body.tone === "guide" || body.tone === "review" ? body.tone : "news",
    notes: typeof body.notes === "string" ? body.notes : "",
    targetStatus: body.targetStatus === "pending_review" ? "pending_review" : "draft",
  });

  return NextResponse.json({ data: result });
}
