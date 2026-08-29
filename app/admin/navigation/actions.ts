"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { updateSiteNavigation } from "@/lib/content";
import type { NavigationLink } from "@/lib/types";

function parseNavigationLinks(value: FormDataEntryValue | null, prefix: string): NavigationLink[] {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line, index) => {
      const [label = "", href = ""] = line.split("|").map((item) => item.trim());
      return {
        id: `${prefix}-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "link"}`,
        label,
        href,
        visible: Boolean(label && href),
      };
    })
    .filter((link) => link.visible);
}

async function ensureCanManageNavigation() {
  if (!canManageSettings(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

export async function updateNavigationAction(formData: FormData) {
  await ensureCanManageNavigation();

  await updateSiteNavigation({
    headerLinks: parseNavigationLinks(formData.get("headerLinks"), "header"),
    footerLinks: parseNavigationLinks(formData.get("footerLinks"), "footer"),
  });

  revalidatePath("/");
  revalidatePath("/admin/navigation");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  redirect("/admin/navigation?saved=1");
}
