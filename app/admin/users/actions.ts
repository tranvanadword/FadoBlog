"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageUsers, getCurrentAdminUser } from "@/lib/auth";
import { countActiveAdmins, createUser, isAdminRole, setUserActive, updateUser, type UserInput } from "@/lib/users";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function ensureCanManageUsers() {
  const user = await getCurrentAdminUser();
  if (!canManageUsers(user.role)) redirect("/admin?error=permission");
  return user;
}

function parseUserInput(formData: FormData, requirePassword: boolean): UserInput {
  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const roleText = readString(formData, "role");
  const role = isAdminRole(roleText) ? roleText : "author";

  if (!name || !email || (requirePassword && !password)) {
    redirect("/admin/users?error=missing");
  }

  if (password && password.length < 8) {
    redirect("/admin/users?error=password");
  }

  return {
    name,
    email,
    role,
    password: password || undefined,
    active: formData.get("active") === "on",
  };
}

function revalidateUsers() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export async function createUserAction(formData: FormData) {
  await ensureCanManageUsers();

  try {
    await createUser(parseUserInput(formData, true));
  } catch {
    redirect("/admin/users?error=create");
  }

  revalidateUsers();
  redirect("/admin/users?saved=created");
}

export async function updateUserAction(id: string, formData: FormData) {
  const currentUser = await ensureCanManageUsers();
  const input = parseUserInput(formData, false);

  if (id === currentUser.id && (!input.active || input.role !== "admin")) {
    redirect("/admin/users?error=self");
  }

  if (!input.active && (await countActiveAdmins(id)) === 0) {
    redirect("/admin/users?error=last-admin");
  }

  try {
    await updateUser(id, input);
  } catch {
    redirect("/admin/users?error=update");
  }

  revalidateUsers();
  redirect("/admin/users?saved=updated");
}

export async function toggleUserActiveAction(id: string, active: boolean) {
  const currentUser = await ensureCanManageUsers();

  if (id === currentUser.id) {
    redirect("/admin/users?error=self");
  }

  if (!active && (await countActiveAdmins(id)) === 0) {
    redirect("/admin/users?error=last-admin");
  }

  try {
    await setUserActive(id, active);
  } catch {
    redirect("/admin/users?error=update");
  }

  revalidateUsers();
  redirect("/admin/users?saved=updated");
}
