import {
  Activity,
  BarChart3,
  Bot,
  CheckSquare,
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
import type { ComponentType } from "react";
import type { AdminRole, AdminUserSession } from "@/lib/auth";
import { canManageMedia, canManageSettings, canManageStructure, canManageUsers, canPublish, canUseAiWorkflow } from "@/lib/auth";

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

export function AdminSidebar({ user }: { user: AdminUserSession }) {
  const visibleLinks = adminLinks.filter((link) => link.visible(user.role));

  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin">
        <span className="admin-brand-mark">F</span>
        <span>
          <small>FADO</small>
          FadoBlog
        </span>
      </Link>

      <nav aria-label="Admin navigation">
        {groups.map((group) => {
          const links = visibleLinks.filter((link) => link.group === group);
          if (links.length === 0) return null;

          return (
            <div className="admin-nav-group" key={group}>
              <p>{group}</p>
              {links.map((link) => {
                const Icon = link.icon;

                return (
                  <Link key={link.href} href={link.href}>
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
          <small>{user.role}</small>
        </span>
        <SlidersHorizontal size={16} strokeWidth={1.8} />
      </div>
    </aside>
  );
}
