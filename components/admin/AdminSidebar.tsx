"use client";

import {
  Activity,
  BarChart3,
  Bot,
  CheckSquare,
  ChevronLeft,
  DatabaseBackup,
  FileText,
  FolderTree,
  Gauge,
  Image,
  LayoutList,
  Mail,
  Newspaper,
  Search,
  Settings,
  SlidersHorizontal,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import type { AdminRole, AdminUserSession } from "@/lib/auth";

type AdminGroup = "Tổng quan" | "Nội dung" | "Tự động hóa" | "Hệ thống";

type AdminLink = {
  label: string;
  href: string;
  group: AdminGroup;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  visible: (role: AdminRole) => boolean;
};

const adminLinks: AdminLink[] = [
  { label: "Dashboard", href: "/admin", group: "Tổng quan", icon: Gauge, visible: () => true },
  { label: "Tìm kiếm", href: "/admin/search", group: "Tổng quan", icon: Search, visible: () => true },
  { label: "Analytics", href: "/admin/analytics", group: "Tổng quan", icon: BarChart3, visible: canPublish },
  { label: "Bài viết", href: "/admin/posts", group: "Nội dung", icon: Newspaper, visible: () => true },
  { label: "Duyệt bài", href: "/admin/reviews", group: "Nội dung", icon: CheckSquare, visible: canPublish },
  { label: "Chuyên mục", href: "/admin/categories", group: "Nội dung", icon: FolderTree, visible: canManageStructure },
  { label: "Tags", href: "/admin/tags", group: "Nội dung", icon: Tags, visible: canManageStructure },
  { label: "Pages", href: "/admin/pages", group: "Nội dung", icon: FileText, visible: canManageStructure },
  { label: "Media", href: "/admin/media", group: "Nội dung", icon: Image, visible: canManageMedia },
  { label: "Navigation", href: "/admin/navigation", group: "Nội dung", icon: LayoutList, visible: canManageSettings },
  { label: "AI Workflow", href: "/admin/ai-workflows", group: "Tự động hóa", icon: Bot, visible: canUseAiWorkflow },
  { label: "Liên hệ", href: "/admin/messages", group: "Hệ thống", icon: Mail, visible: canManageSettings },
  { label: "Backup", href: "/admin/backups", group: "Hệ thống", icon: DatabaseBackup, visible: canManageSettings },
  { label: "Audit log", href: "/admin/audit-logs", group: "Hệ thống", icon: Activity, visible: canManageSettings },
  { label: "Người dùng", href: "/admin/users", group: "Hệ thống", icon: Users, visible: canManageUsers },
  { label: "Settings", href: "/admin/settings", group: "Hệ thống", icon: Settings, visible: canManageSettings },
];

const groups: AdminGroup[] = ["Tổng quan", "Nội dung", "Tự động hóa", "Hệ thống"];

const groupMeta: Record<AdminGroup, { icon: ComponentType<{ size?: number; strokeWidth?: number }>; badge?: string }> = {
  "Tổng quan": { icon: Gauge },
  "Nội dung": { icon: FolderTree },
  "Tự động hóa": { icon: Bot, badge: "AI" },
  "Hệ thống": { icon: Settings },
};

function canPublish(role: AdminRole) {
  return role === "admin" || role === "editor";
}

function canManageStructure(role: AdminRole) {
  return role === "admin" || role === "editor";
}

function canManageMedia(role: AdminRole) {
  return role === "admin" || role === "editor" || role === "author";
}

function canUseAiWorkflow(role: AdminRole) {
  return role === "admin" || role === "editor" || role === "ai_writer";
}

function canManageSettings(role: AdminRole) {
  return role === "admin";
}

function canManageUsers(role: AdminRole) {
  return role === "admin";
}

export function AdminSidebar({ user }: { user: AdminUserSession }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visibleLinks = adminLinks.filter((link) => link.visible(user.role));

  useEffect(() => {
    setCollapsed(localStorage.getItem("fadoblog-sidebar-collapsed") === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("fadoblog-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <aside className={`admin-sidebar${collapsed ? " is-collapsed" : ""}`}>
      <div className="admin-sidebar-head">
        <Link className="admin-brand" href="/admin" title="FadoBlog">
          <span className="admin-brand-mark">F</span>
          <span className="admin-brand-copy">
            <small>FADO</small>
            FadoBlog
          </span>
        </Link>
        <button
          className="admin-sidebar-toggle"
          type="button"
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          aria-pressed={collapsed}
          onClick={toggleCollapsed}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          <ChevronLeft size={16} strokeWidth={2.1} />
        </button>
      </div>

      <nav aria-label="Admin navigation">
        {groups.map((group) => {
          const links = visibleLinks.filter((link) => link.group === group);
          if (links.length === 0) return null;
          const GroupIcon = groupMeta[group].icon;

          return (
            <div className="admin-nav-group" key={group}>
              <p>
                <GroupIcon size={13} strokeWidth={2} />
                <span>{group}</span>
                {groupMeta[group].badge ? <small>{groupMeta[group].badge}</small> : null}
              </p>
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={isActive ? "is-active" : undefined}
                    title={collapsed ? link.label : undefined}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="admin-sidebar-profile">
        <span className="admin-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
        <span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </span>
        <SlidersHorizontal size={16} strokeWidth={1.8} />
      </div>
    </aside>
  );
}
