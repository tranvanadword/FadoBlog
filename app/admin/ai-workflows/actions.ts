"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canDeleteContent, canUseAiWorkflow, getCurrentAdminRole } from "@/lib/auth";
import {
  createAiWorkflow,
  deleteAiWorkflow,
  runAiDraftWorkflow,
  runDueAiWorkflows,
  runSavedAiWorkflow,
  toggleAiWorkflow,
  type AiDraftWorkflowInput,
  type AiWorkflowInput,
} from "@/lib/content";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readTone(formData: FormData): AiDraftWorkflowInput["tone"] {
  const tone = readString(formData, "tone");
  return tone === "guide" || tone === "review" ? tone : "news";
}

function readTargetStatus(formData: FormData): AiDraftWorkflowInput["targetStatus"] {
  return readString(formData, "targetStatus") === "pending_review" ? "pending_review" : "draft";
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function ensureCanUseAiWorkflow() {
  if (!canUseAiWorkflow(await getCurrentAdminRole())) redirect("/admin?error=permission");
}

function parseWorkflowInput(formData: FormData): AiWorkflowInput {
  const name = readString(formData, "name");
  const topicTemplate = readString(formData, "topicTemplate");
  const categorySlug = readString(formData, "categorySlug");

  if (!name || !topicTemplate || !categorySlug) {
    redirect("/admin/ai-workflows?error=workflow-missing");
  }

  return {
    name,
    topicTemplate,
    categorySlug,
    tone: readTone(formData),
    notes: readString(formData, "notes"),
    targetStatus: readTargetStatus(formData),
    scheduleRule: readString(formData, "scheduleRule") || "manual",
    active: readBoolean(formData, "active"),
    autoPublish: false,
  };
}

export async function generateAiDraftAction(formData: FormData) {
  await ensureCanUseAiWorkflow();

  const topic = readString(formData, "topic");
  const categorySlug = readString(formData, "categorySlug");

  if (!topic || !categorySlug) {
    redirect("/admin/ai-workflows?error=missing");
  }

  const result = await runAiDraftWorkflow({
    topic,
    categorySlug,
    tone: readTone(formData),
    notes: readString(formData, "notes"),
    targetStatus: readTargetStatus(formData),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/ai-workflows");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  revalidatePath(`/category/${result.post.category.slug}`);
  redirect(`/admin/posts/${result.post.id}/edit`);
}

export async function createAiWorkflowAction(formData: FormData) {
  await ensureCanUseAiWorkflow();

  await createAiWorkflow(parseWorkflowInput(formData));
  revalidatePath("/admin/ai-workflows");
  redirect("/admin/ai-workflows");
}

export async function toggleAiWorkflowAction(id: string) {
  await ensureCanUseAiWorkflow();

  await toggleAiWorkflow(id);
  revalidatePath("/admin/ai-workflows");
  redirect("/admin/ai-workflows");
}

export async function deleteAiWorkflowAction(id: string) {
  await ensureCanUseAiWorkflow();
  if (!canDeleteContent(await getCurrentAdminRole())) redirect("/admin/ai-workflows?error=permission");

  await deleteAiWorkflow(id);
  revalidatePath("/admin/ai-workflows");
  redirect("/admin/ai-workflows");
}

export async function runAiWorkflowAction(id: string) {
  await ensureCanUseAiWorkflow();

  const result = await runSavedAiWorkflow(id);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/ai-workflows");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  revalidatePath(`/category/${result.post.category.slug}`);
  redirect(`/admin/posts/${result.post.id}/edit`);
}

export async function runDueAiWorkflowsAction() {
  await ensureCanUseAiWorkflow();

  await runDueAiWorkflows();
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/ai-workflows");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  redirect("/admin/ai-workflows");
}
