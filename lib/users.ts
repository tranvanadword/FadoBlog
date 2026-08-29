import type { AdminRole } from "./auth";
import { adminRoles, createPasswordHash, normalizeRole } from "./auth";
import { getD1Database } from "./cloudflare";
import { getPrismaClient } from "./prisma";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  postCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserInput = {
  name: string;
  email: string;
  role: AdminRole;
  password?: string;
  active: boolean;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean | number;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: { posts: number };
  postCount?: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function dateText(value: Date | string) {
  return (typeof value === "string" ? value : value.toISOString()).slice(0, 10);
}

function mapUser(user: UserRow): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    active: Boolean(user.active),
    postCount: user._count?.posts ?? user.postCount ?? 0,
    createdAt: dateText(user.createdAt),
    updatedAt: dateText(user.updatedAt),
  };
}

export function isAdminRole(role: string): role is AdminRole {
  return adminRoles.includes(role as AdminRole);
}

async function getD1UserById(id: string) {
  const d1 = await getD1Database();
  if (!d1) return null;

  const user = await d1
    .prepare(
      `
      SELECT
        User.id,
        User.name,
        User.email,
        User.role,
        User.active,
        User.createdAt,
        User.updatedAt,
        COUNT(Post.id) AS postCount
      FROM User
      LEFT JOIN Post ON Post.authorId = User.id
      WHERE User.id = ?
      GROUP BY User.id
    `,
    )
    .bind(id)
    .first<UserRow>();

  return user ? mapUser(user) : null;
}

export async function listUsers() {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Database();
    if (d1) {
      const users = await d1
        .prepare(
          `
          SELECT
            User.id,
            User.name,
            User.email,
            User.role,
            User.active,
            User.createdAt,
            User.updatedAt,
            COUNT(Post.id) AS postCount
          FROM User
          LEFT JOIN Post ON Post.authorId = User.id
          GROUP BY User.id
          ORDER BY User.active DESC, User.createdAt DESC
        `,
        )
        .all<UserRow>();

      return users.results.map(mapUser);
    }

    return [
      {
        id: "env-admin",
        name: "Admin",
        email: process.env.ADMIN_EMAIL || "admin@fadoblog.local",
        role: normalizeRole(process.env.ADMIN_ROLE),
        active: true,
        postCount: 0,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    ] satisfies AdminUser[];
  }

  const users = await prisma.user.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return users.map(mapUser);
}

export async function createUser(input: UserInput) {
  const prisma = getPrismaClient();
  if (!input.password || input.password.length < 8) throw new Error("Mat khau toi thieu 8 ky tu.");

  if (!prisma) {
    const d1 = await getD1Database();
    if (!d1) throw new Error("Database chua san sang.");

    const now = new Date().toISOString();
    const user = {
      id: `user-${crypto.randomUUID()}`,
      name: input.name,
      email: normalizeEmail(input.email),
      role: input.role,
      active: input.active,
      passwordHash: await createPasswordHash(input.password),
      createdAt: now,
      updatedAt: now,
      postCount: 0,
    };

    await d1
      .prepare("INSERT INTO User (id, name, email, passwordHash, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(user.id, user.name, user.email, user.passwordHash, user.role, user.active ? 1 : 0, user.createdAt, user.updatedAt)
      .run();

    return mapUser(user);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: normalizeEmail(input.email),
      role: input.role,
      active: input.active,
      passwordHash: await createPasswordHash(input.password),
    },
    include: { _count: { select: { posts: true } } },
  });

  return mapUser(user);
}

export async function updateUser(id: string, input: UserInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Database();
    if (!d1) throw new Error("Database chua san sang.");

    const now = new Date().toISOString();
    const passwordHash = input.password ? await createPasswordHash(input.password) : undefined;
    if (passwordHash) {
      await d1
        .prepare("UPDATE User SET name = ?, email = ?, role = ?, active = ?, passwordHash = ?, updatedAt = ? WHERE id = ?")
        .bind(input.name, normalizeEmail(input.email), input.role, input.active ? 1 : 0, passwordHash, now, id)
        .run();
    } else {
      await d1
        .prepare("UPDATE User SET name = ?, email = ?, role = ?, active = ?, updatedAt = ? WHERE id = ?")
        .bind(input.name, normalizeEmail(input.email), input.role, input.active ? 1 : 0, now, id)
        .run();
    }

    const user = await getD1UserById(id);
    if (!user) throw new Error("Khong tim thay user.");
    return user;
  }

  const data = {
    name: input.name,
    email: normalizeEmail(input.email),
    role: input.role,
    active: input.active,
    ...(input.password ? { passwordHash: await createPasswordHash(input.password) } : {}),
  };

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { _count: { select: { posts: true } } },
  });

  return mapUser(user);
}

export async function setUserActive(id: string, active: boolean) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Database();
    if (!d1) throw new Error("Database chua san sang.");

    await d1.prepare("UPDATE User SET active = ?, updatedAt = ? WHERE id = ?").bind(active ? 1 : 0, new Date().toISOString(), id).run();
    const user = await getD1UserById(id);
    if (!user) throw new Error("Khong tim thay user.");
    return user;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { active },
    include: { _count: { select: { posts: true } } },
  });

  return mapUser(user);
}

export async function countActiveAdmins(exceptUserId?: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const d1 = await getD1Database();
    if (!d1) return 1;

    const row = exceptUserId
      ? await d1.prepare("SELECT COUNT(*) AS total FROM User WHERE active = 1 AND role = 'admin' AND id != ?").bind(exceptUserId).first<{ total: number }>()
      : await d1.prepare("SELECT COUNT(*) AS total FROM User WHERE active = 1 AND role = 'admin'").first<{ total: number }>();

    return row?.total ?? 0;
  }

  return prisma.user.count({
    where: {
      active: true,
      role: "admin",
      ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
    },
  });
}
