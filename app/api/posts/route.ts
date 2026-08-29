import { NextResponse } from "next/server";
import { listPublishedPosts } from "@/lib/content";

export async function GET() {
  return NextResponse.json({ data: await listPublishedPosts() });
}
