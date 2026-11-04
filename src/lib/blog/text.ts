/** Small helpers shared by the editor (browser) and the pages (server). No Node-only code here. */

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const stripTags = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|h[1-6]|li|blockquote|figcaption|tr)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const wordCount = (html: string) => {
  const t = stripTags(html);
  return t ? t.split(" ").length : 0;
};

export const readingMinutes = (html: string) => Math.max(1, Math.round(wordCount(html) / 200));

export const isFuture = (iso: string) => !!iso && new Date(iso).getTime() > Date.now();

export const formatDate = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
};

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://brightsunseo.com").replace(/\/$/, "");
