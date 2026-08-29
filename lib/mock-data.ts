import type { Category, Post } from "./types";

export const categories: Category[] = [
  { id: "travel", name: "Du lịch", slug: "du-lich", description: "Lịch trình, trải nghiệm và ghi chú cho những chuyến đi đáng nhớ." },
  { id: "food", name: "Ẩm thực", slug: "am-thuc", description: "Món ngon, quán nhỏ và văn hóa ăn uống địa phương." },
  { id: "tech", name: "Công nghệ", slug: "cong-nghe", description: "Công cụ, AI và cách làm việc hiệu quả hơn." },
  { id: "life", name: "Đời sống", slug: "doi-song", description: "Những ý tưởng giúp ngày thường gọn gàng và có nhịp hơn." }
];

export const posts: Post[] = [
  {
    id: "post-1",
    title: "Một ngày chậm rãi ở thành phố biển",
    slug: "mot-ngay-cham-rai-o-thanh-pho-bien",
    excerpt: "Lịch trình nhẹ nhàng cho một ngày có cà phê sáng, chợ địa phương và hoàng hôn bên bờ nước.",
    content: "Một ngày tốt để khám phá thành phố biển không cần bắt đầu bằng lịch trình dày đặc. Hãy chọn một quán cà phê gần khu dân cư, đi chợ vào cuối buổi sáng, rồi dành buổi chiều cho những con đường ít khách du lịch hơn.",
    status: "published",
    coverImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    category: categories[0],
    author: "FadoBlog Editorial",
    readingMinutes: 6,
    publishedAt: "2026-08-29",
    tags: ["du lịch", "lịch trình", "biển"]
  },
  {
    id: "post-2",
    title: "Những món nên thử khi ghé chợ sáng",
    slug: "nhung-mon-nen-thu-khi-ghe-cho-sang",
    excerpt: "Cách chọn món, hỏi giá và vài gợi ý để bắt đầu một buổi sáng đầy năng lượng.",
    content: "Chợ sáng là bản đồ hương vị dễ đọc nhất của một địa phương. Nên đi sớm, quan sát quầy nào đông khách quen, hỏi phần nhỏ để thử nhiều món, và luôn để bụng cho một ly nước mát cuối buổi.",
    status: "published",
    coverImage: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80",
    category: categories[1],
    author: "FadoBlog Editorial",
    readingMinutes: 4,
    publishedAt: "2026-08-28",
    tags: ["ẩm thực", "chợ sáng"]
  },
  {
    id: "post-3",
    title: "Ghi chú để ý tưởng không bị rơi",
    slug: "ghi-chu-de-y-tuong-khong-bi-roi",
    excerpt: "Một hệ thống ghi nhanh đơn giản cho người hay di chuyển và hay có ý tưởng bất chợt.",
    content: "Một hệ thống ghi chú tốt không cần phức tạp. Chỉ cần một nơi thu thập nhanh, một lịch xem lại hằng tuần và vài nhãn rõ ràng.",
    status: "published",
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    category: categories[3],
    author: "FadoBlog Editorial",
    readingMinutes: 5,
    publishedAt: "2026-08-27",
    tags: ["đời sống", "ghi chú", "năng suất"]
  }
];

export function getPublishedPosts() {
  return posts.filter((post) => post.status === "published");
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug && post.status === "published");
}

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getPostsByCategory(slug: string) {
  return getPublishedPosts().filter((post) => post.category.slug === slug);
}
