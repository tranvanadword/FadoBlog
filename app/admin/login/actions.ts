"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminSessionCookie,
  createAdminSessionToken,
  createPasswordHash,
  getAdminCredentials,
  verifyPassword,
} from "@/lib/auth";
import { recordAuditLog } from "@/lib/content";
import { getD1Database } from "@/lib/cloudflare";
import { getPrismaClient } from "@/lib/prisma";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function loginAction(formData: FormData) {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const next = readString(formData, "next") || "/admin";
  const credentials = getAdminCredentials();
  const prisma = getPrismaClient();

  let userId = "env-admin";

  if (prisma) {
    const user = await prisma.user.findUnique({ where: { email } });
    const isEnvAdmin = email === credentials.email && password === credentials.password;

    if (!user || !user.active || (!(await verifyPassword(password, user.passwordHash)) && !isEnvAdmin)) {
      redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
    }

    if (!user.passwordHash && isEnvAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await createPasswordHash(password) },
      });
    }

    userId = user.id;
  } else {
    const d1 = await getD1Database();
    if (d1) {
      const user = await d1
        .prepare("SELECT id, email, passwordHash, active FROM User WHERE email = ?")
        .bind(email)
        .first<{ id: string; email: string; passwordHash: string | null; active: number }>();
      const isEnvAdmin = email === credentials.email && password === credentials.password;

      if (user) {
        if (!user.active || (!(await verifyPassword(password, user.passwordHash)) && !isEnvAdmin)) {
          redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
        }

        if (!user.passwordHash && isEnvAdmin) {
          await d1.prepare("UPDATE User SET passwordHash = ?, updatedAt = ? WHERE id = ?").bind(await createPasswordHash(password), new Date().toISOString(), user.id).run();
        }

        userId = user.id;
      } else if (isEnvAdmin) {
        const now = new Date().toISOString();
        await d1
          .prepare("INSERT INTO User (id, name, email, passwordHash, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)")
          .bind("env-admin", "Admin", email, await createPasswordHash(password), now, now)
          .run();
        userId = "env-admin";
      } else {
        redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
      }
    } else if (email !== credentials.email || password !== credentials.password) {
      redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
    }
  }

  const token = await createAdminSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  await recordAuditLog({
    actorId: userId,
    actorEmail: email,
    action: "login",
    entityType: "admin",
    entityId: userId,
    summary: `Đăng nhập admin: ${email}`,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookie);
  redirect("/admin/login");
}
