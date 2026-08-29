import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function createPasswordHash(password) {
  const secret = process.env.NEXTAUTH_SECRET || "change-me";
  return createHash("sha256").update(`${secret}:password:${password}`).digest("hex");
}

const categories = [
  { name: "Du lịch", slug: "du-lich", description: "Lịch trình, trải nghiệm và ghi chú cho những chuyến đi đáng nhớ." },
  { name: "Ẩm thực", slug: "am-thuc", description: "Món ngon, quán nhỏ và văn hóa ăn uống địa phương." },
  { name: "Công nghệ", slug: "cong-nghe", description: "Công cụ, AI và cách làm việc hiệu quả hơn." },
  { name: "Đời sống", slug: "doi-song", description: "Những ý tưởng giúp ngày thường gọn gàng và có nhịp hơn." },
];

const tags = [
  { name: "AI", slug: "ai" },
  { name: "Du lịch", slug: "du-lich" },
  { name: "Ẩm thực", slug: "am-thuc" },
  { name: "Năng suất", slug: "nang-suat" },
];

const pages = [
  {
    title: "Giới thiệu FadoBlog",
    slug: "gioi-thieu",
    content:
      "FadoBlog là nền tảng tin tức/blog được xây dựng theo hướng CMS hiện đại, có thể quản lý nội dung thủ công và mở rộng workflow AI.",
    status: "published",
    seoTitle: "Giới thiệu FadoBlog",
    metaDescription: "Tìm hiểu về FadoBlog và định hướng phát triển nền tảng nội dung.",
  },
  {
    title: "Liên hệ",
    slug: "lien-he",
    content: "Gửi liên hệ cho đội ngũ FadoBlog qua form bên dưới.",
    status: "published",
    seoTitle: "Liên hệ FadoBlog",
    metaDescription: "Liên hệ với đội ngũ FadoBlog.",
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fadoblog.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "fadoblog-admin";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "FadoBlog Admin",
      active: true,
      role: "admin",
      passwordHash: createPasswordHash(adminPassword),
    },
    create: {
      name: "FadoBlog Admin",
      email: adminEmail,
      role: "admin",
      active: true,
      passwordHash: createPasswordHash(adminPassword),
    },
  });

  const createdCategories = [];
  for (const category of categories) {
    createdCategories.push(
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    );
  }

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
  }

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
  }

  const post = await prisma.post.upsert({
    where: { slug: "mot-ngay-cham-rai-o-thanh-pho-bien" },
    update: {},
    create: {
      title: "Một ngày chậm rãi ở thành phố biển",
      slug: "mot-ngay-cham-rai-o-thanh-pho-bien",
      excerpt: "Lịch trình nhẹ nhàng cho một ngày có cà phê sáng, chợ địa phương và hoàng hôn bên bờ nước.",
      content:
        "Một ngày tốt để khám phá thành phố biển không cần bắt đầu bằng lịch trình dày đặc. Hãy chọn một quán cà phê gần khu dân cư, đi chợ vào cuối buổi sáng, rồi dành buổi chiều cho những con đường ít khách du lịch hơn.",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-08-29"),
      authorId: admin.id,
      categoryId: createdCategories[0].id,
    },
  });

  const travelTag = await prisma.tag.findUnique({ where: { slug: "du-lich" } });
  if (travelTag) {
    await prisma.postTag.upsert({
      where: { postId_tagId: { postId: post.id, tagId: travelTag.id } },
      update: {},
      create: { postId: post.id, tagId: travelTag.id },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
