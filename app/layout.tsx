import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FadoBlog",
  description: "Tin tuc, cong nghe, du lich, am thuc va doi song.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
