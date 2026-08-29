const allowedTags = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h2",
  "h3",
  "hr",
  "a",
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function toPlainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function paragraphize(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "";
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
}

export function renderArticleHtml(value: string) {
  const source = value.trim();
  if (!source) return "";
  const html = /<\/?[a-z][\s\S]*>/i.test(source) ? source : paragraphize(source);

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\shref=["']\s*javascript:[^"']*["']/gi, "")
    .replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tagName, attrs = "") => {
      const tag = String(tagName).toLowerCase();
      if (!allowedTags.has(tag)) return "";
      if (tag !== "a") return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;

      const href = String(attrs).match(/\shref=["']([^"']+)["']/i)?.[1] ?? "#";
      const safeHref = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/") || href.startsWith("#") ? href : "#";
      return match.startsWith("</") ? "</a>" : `<a href="${escapeHtml(safeHref)}">`;
    });
}
