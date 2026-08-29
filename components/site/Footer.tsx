import Link from "next/link";
import { getSiteSettings, listCategories } from "@/lib/content";

export async function Footer() {
  const [categories, settings] = await Promise.all([listCategories(), getSiteSettings()]);
  const brandInitial = settings.siteName.trim().charAt(0).toUpperCase() || "F";
  const navigation =
    settings.footerLinks.length > 0
      ? settings.footerLinks.filter((link) => link.visible)
      : [
          ...categories.map((category) => ({ id: category.id, label: category.name, href: "/category/" + category.slug })),
          { id: "about", label: "Giới thiệu", href: "/page/gioi-thieu" },
          { id: "contact", label: "Liên hệ", href: "/page/lien-he" },
          { id: "privacy", label: "Chính sách", href: "/page/chinh-sach-bao-mat" },
          { id: "terms", label: "Điều khoản", href: "/page/dieu-khoan-su-dung" },
          { id: "rss", label: "RSS", href: "/rss.xml" },
        ];

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Link className="brand footer-brand" href="/">
            {settings.logoUrl ? (
              <img className="brand-logo" src={settings.logoUrl} alt="" />
            ) : (
              <span className="brand-mark">{brandInitial}</span>
            )}
            <span>{settings.siteName}</span>
          </Link>
          <p>{settings.siteDescription}</p>
        </div>
        <div className="footer-links">
          {navigation.map((link) => (
            <Link key={link.id} href={link.href}>
              {link.label}
            </Link>
          ))}
          {settings.facebookUrl ? <Link href={settings.facebookUrl}>Facebook</Link> : null}
          {settings.youtubeUrl ? <Link href={settings.youtubeUrl}>YouTube</Link> : null}
          {settings.linkedinUrl ? <Link href={settings.linkedinUrl}>LinkedIn</Link> : null}
        </div>
      </div>
      <p className="copyright">© 2026 {settings.siteName}.</p>
    </footer>
  );
}
