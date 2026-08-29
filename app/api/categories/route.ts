import { NextResponse } from "next/server";
import { listCategories } from "@/lib/content";

export async function GET() {
  return NextResponse.json({ data: await listCategories() });
}
