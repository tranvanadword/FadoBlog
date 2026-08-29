"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageSettings, getCurrentAdminRole, getCurrentAdminUser } from "@/lib/auth";
import { recordAuditLog, restoreLocalBackupSnapshot } from "@/lib/content";

export async function restoreBackupAction(formData: FormData) {
  const user = await getCurrentAdminUser();
  if (!canManageSettings(await getCurrentAdminRole())) redirect("/admin?error=permission");

  const file = formData.get("backupFile");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/backups?error=missing-file");
  }

  try {
    const text = await file.text();
    const snapshot = JSON.parse(text);
    const result = await restoreLocalBackupSnapshot(snapshot);
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: "backup.restore",
      entityType: "backup",
      summary: `Restore backup: ${result.posts} posts, ${result.pages} pages, ${result.categories} categories`,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/backups");
    revalidatePath("/admin/posts");
    revalidatePath("/admin/pages");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/tags");
    revalidatePath("/admin/media");
    revalidatePath("/admin/messages");
    revalidatePath("/admin/analytics");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
  } catch {
    redirect("/admin/backups?error=invalid-backup");
  }

  redirect("/admin/backups?restored=1");
}
