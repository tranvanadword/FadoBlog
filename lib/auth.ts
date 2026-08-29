import type { PostStatus } from "./types";
import { getD1Database } from "./cloudflare";
import { getPrismaClient } from "./prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminRoles = ["admin", "editor", "author", "ai_writer"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const adminSessionCookie = "fadoblog_admin_session";

export type AdminUserSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

const roleLabels: Record<AdminRole, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  author: "Tác giả",
  ai_writer: "AI Writer",
};

export function normalizeRole(role?: string): AdminRole {
  return adminRoles.includes(role as AdminRole) ? (role as AdminRole) : "admin";
}

function getSessionSecret() {
  return process.env.NEXTAUTH_SECRET || "change-me";
}

export function getRoleLabel(role: AdminRole) {
  return roleLabels[role];
}

export function canPublish(role: AdminRole) {
  return role === "admin" || role === "editor";
}

export function canManageContent(role: AdminRole) {
  return role === "admin" || role === "editor" || role === "author";
}

export function canManageStructure(role: AdminRole) {
  return role === "admin" || role === "editor";
}

export function canManageMedia(role: AdminRole) {
  return role === "admin" || role === "editor" || role === "author";
}

export function canDeleteContent(role: AdminRole) {
  return role === "admin" || role === "editor";
}

export function canUseAiWorkflow(role: AdminRole) {
  return role === "admin" || role === "editor" || role === "ai_writer";
}

export function canManageSettings(role: AdminRole) {
  return role === "admin";
}

export function allowedPostStatuses(role: AdminRole): readonly PostStatus[] {
  if (canPublish(role)) return ["draft", "pending_review", "scheduled", "published", "archived"];
  return ["draft", "pending_review"];
}

export function allowedPageStatuses(role: AdminRole): readonly PostStatus[] {
  if (canPublish(role)) return ["draft", "pending_review", "published", "archived"];
  return ["draft", "pending_review"];
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@fadoblog.local",
    password: process.env.ADMIN_PASSWORD || "fadoblog-admin",
  };
}

async function digest(input: string) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createPasswordHash(password: string) {
  return digest(`${getSessionSecret()}:password:${password}`);
}

export async function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;
  return passwordHash === (await createPasswordHash(password));
}

export async function createAdminSessionToken(userId: string) {
  const signature = await digest(`${userId}:${getSessionSecret()}`);
  return `${userId}.${signature}`;
}

export async function getAdminSessionUserId(token?: string) {
  if (!token) return undefined;
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return undefined;
  return signature === (await digest(`${userId}:${getSessionSecret()}`)) ? userId : undefined;
}

export async function isValidAdminSession(token?: string) {
  return Boolean(await getAdminSessionUserId(token));
}

export async function getCurrentAdminUserFromToken(token?: string): Promise<AdminUserSession | null> {
  const prisma = getPrismaClient();
  const userId = await getAdminSessionUserId(token);
  if (!userId) return null;

  if (!prisma) {
    const d1 = await getD1Database();
    if (d1) {
      const user = await d1
        .prepare("SELECT id, name, email, role FROM User WHERE id = ? AND active = 1")
        .bind(userId)
        .first<{ id: string; name: string; email: string; role: string }>();

      if (user) return { ...user, role: normalizeRole(user.role) };
    }

    if (userId !== "env-admin") return null;

    const credentials = getAdminCredentials();
    return {
      id: "env-admin",
      name: "Admin",
      email: credentials.email,
      role: normalizeRole(process.env.ADMIN_ROLE),
    };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, active: true },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) return null;
  return { ...user, role: normalizeRole(user.role) };
}

export async function getCurrentAdminUser(): Promise<AdminUserSession> {
  const cookieStore = await cookies();
  const sessionUser = await getCurrentAdminUserFromToken(cookieStore.get(adminSessionCookie)?.value);

  if (sessionUser) return sessionUser;
  return redirect("/admin/login");
}

export async function getCurrentAdminRole(): Promise<AdminRole> {
  return (await getCurrentAdminUser()).role;
}

export function canManageUsers(role: AdminRole) {
  return role === "admin";
}
