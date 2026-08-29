import { NextResponse } from "next/server";
import { getDatabaseStatus } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { getCloudflareBindingStatus } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDatabaseStatus();
  const settings = await getSiteSettings();
  const cloudflare = await getCloudflareBindingStatus();
  const checks = {
    app: "ok",
    database: db.provider,
    cloudflareD1: cloudflare.d1 ? "bound" : "not-bound",
    cloudflareR2: cloudflare.r2 ? "bound" : "not-bound",
    publicUrl: settings.publicUrl,
    openAi: process.env.OPENAI_API_KEY ? "configured" : "missing",
    cronSecret: process.env.CRON_SECRET ? "configured" : "required",
  };

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    checks,
    message: db.message,
  });
}
