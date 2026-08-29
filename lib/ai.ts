export type GeneratePostInput = {
  topic: string;
  categorySlug?: string;
  tone?: "news" | "guide" | "review";
  notes?: string;
};

export type GeneratedPostDraft = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  source: "mock" | "openai";
};

function fallbackDraft(input: GeneratePostInput): GeneratedPostDraft {
  const toneLabel = input.tone === "review" ? "đánh giá" : input.tone === "guide" ? "hướng dẫn" : "tin tức";

  return {
    title: `Bản nháp ${toneLabel}: ${input.topic}`,
    excerpt: `Tổng quan nhanh về ${input.topic}, được tạo bằng workflow AI mẫu của FadoBlog.`,
    content: [
      `# ${input.topic}`,
      "",
      `Đây là bản nháp ${toneLabel} được tạo tự động để kiểm tra luồng xuất bản của FadoBlog.`,
      "",
      "## Điểm chính",
      "",
      `Chủ đề ${input.topic} cần được triển khai theo hướng dễ đọc, rõ bối cảnh và có giá trị thực tế cho độc giả.`,
      "",
      "## Gợi ý biên tập",
      "",
      input.notes || "Bổ sung nguồn, ví dụ cụ thể và kiểm tra lại thông tin trước khi xuất bản.",
    ].join("\n"),
    seoTitle: `${input.topic} | FadoBlog`,
    metaDescription: `Bài viết tổng quan về ${input.topic} trên FadoBlog.`,
    source: "mock",
  };
}

function extractOutputText(response: unknown) {
  if (!response || typeof response !== "object") return "";
  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") return outputText;

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ?? "";
}

function parseJsonDraft(text: string, input: GeneratePostInput): GeneratedPostDraft {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  const parsed = JSON.parse(cleaned) as Partial<GeneratedPostDraft>;

  return {
    title: parsed.title || `Bản nháp: ${input.topic}`,
    slug: parsed.slug,
    excerpt: parsed.excerpt || `Tổng quan về ${input.topic}.`,
    content: parsed.content || text,
    seoTitle: parsed.seoTitle || parsed.title || input.topic,
    metaDescription: parsed.metaDescription || parsed.excerpt || `Bài viết về ${input.topic}.`,
    source: "openai",
  };
}

export async function generatePostDraft(input: GeneratePostInput): Promise<GeneratedPostDraft> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackDraft(input);
  }

  const prompt = [
    "Bạn là biên tập viên tiếng Việt cho website tin tức FadoBlog.",
    "Hãy tạo một bài viết nháp để admin duyệt trước khi xuất bản.",
    "Trả về duy nhất JSON hợp lệ với các field: title, slug, excerpt, content, seoTitle, metaDescription.",
    "Không bọc JSON trong markdown.",
    "",
    `Chủ đề: ${input.topic}`,
    `Chuyên mục slug: ${input.categorySlug || "cong-nghe"}`,
    `Giọng viết: ${input.tone || "news"}`,
    `Ghi chú: ${input.notes || "Không có"}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      input: prompt,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed: ${message}`);
  }

  const data = await response.json();
  const text = extractOutputText(data);
  return parseJsonDraft(text, input);
}
