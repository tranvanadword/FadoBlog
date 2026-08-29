"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageSettings, getCurrentAdminRole } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/content";
import type { SiteSettings } from "@/lib/types";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanManageSettings() {
  if (!canManageSettings(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

export async function updateSiteSettingsAction(formData: FormData) {
  await ensureCanManageSettings();

  const current = await getSiteSettings();
  const input: SiteSettings = {
    siteName: readString(formData, "siteName"),
    siteDescription: readString(formData, "siteDescription"),
    logoUrl: readString(formData, "logoUrl"),
    publicUrl: readString(formData, "publicUrl"),
    defaultSeoTitle: readString(formData, "defaultSeoTitle"),
    defaultMetaDescription: readString(formData, "defaultMetaDescription"),
    facebookUrl: readString(formData, "facebookUrl"),
    youtubeUrl: readString(formData, "youtubeUrl"),
    linkedinUrl: readString(formData, "linkedinUrl"),
    contactEmail: readString(formData, "contactEmail"),
    headerLinks: current.headerLinks,
    footerLinks: current.footerLinks,
  };

  await updateSiteSettings(input);

  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
  revalidatePath("/rss.xml");
  redirect("/admin/settings?saved=1");
}
