import { listPublic } from "@/lib/blog/store";
import { SITE_URL } from "@/lib/blog/text";
import { siteConfig } from "@/data/site";

export const dynamic = "force-dynamic";

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = (await listPublic()).slice(0, 30);
  const items = posts
    .map((p) => `<item><title>${x(p.title)}</title><link>${SITE_URL}/blogs/${p.slug}</link><guid>${SITE_URL}/blogs/${p.slug}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${x(p.seo.metaDescription || p.excerpt)}</description></item>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(siteConfig.name)} Blog</title><link>${SITE_URL}/blogs</link><description>${x(siteConfig.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
