import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminSessionCookie, canManageSettings, getCurrentAdminUserFromToken } from "@/lib/auth";
import { createBackupSnapshot, recordAuditLog } from "@/lib/content";

export const dynamic = "force-dynamic";

function backupFilename() {
  return `fadoblog-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentAdminUserFromToken(cookieStore.get(adminSessionCookie)?.value);

  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json({ error: "Bạn chưa có quyền tải backup." }, { status: 403 });
  }

  const snapshot = await createBackupSnapshot();
  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: "backup.export",
    entityType: "backup",
    summary: `Xuất backup dữ liệu từ ${snapshot.metadata.source}`,
  });

  return new Response(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${backupFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}
