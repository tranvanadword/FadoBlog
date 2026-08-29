"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { updateContactMessageStatus } from "@/lib/content";
import type { ContactMessageStatus } from "@/lib/types";

async function changeMessageStatus(id: string, status: ContactMessageStatus) {
  if (!canManageSettings(await getCurrentAdminRole())) redirect("/admin?error=permission");
  await updateContactMessageStatus(id, status);
  revalidatePath("/admin/messages");
}

export async function markMessageReadAction(id: string) {
  await changeMessageStatus(id, "read");
  redirect("/admin/messages");
}

export async function archiveMessageAction(id: string) {
  await changeMessageStatus(id, "archived");
  redirect("/admin/messages");
}
