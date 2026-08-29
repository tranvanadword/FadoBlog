import Link from "next/link";
import { getSiteSettings, listCategories } from "@/lib/content";

export async function Header() {
  const [categories, settings] = await Promise.all([listCategories(), getSiteSettings()]);
  const brandInitial = settings.siteName.trim().charAt(0).toUpperCase() || "F";
  const navigation =
    settings.headerLinks.length > 0
      ? settings.headerLinks.filter((link) => link.visible)
      : [
          ...categories.map((category) => ({ id: category.id, label: category.name, href: "/category/" + category.slug })),
          { id: "admin", label: "Admin", href: "/admin" },
        ];

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Điều hướng chính">
        <Link className="brand" href="/" aria-label={`${settings.siteName} trang chủ`}>
          {settings.logoUrl ? (
            <img className="brand-logo" src={settings.logoUrl} alt="" />
          ) : (
            <span className="brand-mark">{brandInitial}</span>
          )}
          <span>{settings.siteName}</span>
        </Link>
        <div className="nav-links">
          {navigation.map((link) => (
            <Link key={link.id} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
