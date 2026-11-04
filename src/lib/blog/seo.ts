import { stripTags, wordCount } from "./text";

export type Check = { id: string; level: "good" | "warn" | "bad"; label: string; tip?: string };

type Input = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverAlt: string;
  seo: { metaTitle: string; metaDescription: string; focusKeyword: string };
};

const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

/** The live SEO checklist shown beside the editor. */
export function analyse(p: Input): { score: number; checks: Check[] } {
  const k = p.seo.focusKeyword.trim();
  const text = stripTags(p.content);
  const words = wordCount(p.content);
  const firstPara = stripTags((p.content.match(/<p[\s>][\s\S]*?<\/p>/i) || [""])[0]);
  const metaTitle = p.seo.metaTitle.trim() || p.title.trim();
  const metaDesc = p.seo.metaDescription.trim() || p.excerpt.trim();
  const imgs = [...p.content.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt="[^"]+"/i.test(t)).length;
  const internal = [...p.content.matchAll(/<a\b[^>]*href="([^"]*)"/gi)].filter((m) => m[1].startsWith("/") || /brightsunseo\.com/i.test(m[1])).length;
  const external = [...p.content.matchAll(/<a\b[^>]*href="(https?:[^"]*)"/gi)].filter((m) => !/brightsunseo\.com/i.test(m[1])).length;
  const h2 = (p.content.match(/<h2[\s>]/gi) || []).length;
  const c: Check[] = [];
  const add = (id: string, ok: boolean | "warn", label: string, tip?: string) => c.push({ id, level: ok === true ? "good" : ok === "warn" ? "warn" : "bad", label, tip: ok === true ? undefined : tip });

  add("kw", !!k, k ? `Focus keyword: "${k}"` : "Add a focus keyword", "The one phrase this post should rank for.");
  if (k) {
    add("kw-title", has(metaTitle, k), "Keyword is in the SEO title", "Put the focus keyword near the start of the SEO title.");
    add("kw-slug", has(p.slug.replace(/-/g, " "), k), "Keyword is in the web address", "Use the keyword in the slug, e.g. /blogs/seo-for-small-business.");
    add("kw-first", has(firstPara, k), "Keyword is in the first paragraph", "Mention the keyword in your opening paragraph.");
    add("kw-desc", has(metaDesc, k), "Keyword is in the meta description", "Add the keyword once in the meta description.");
    const n = text ? (text.toLowerCase().split(k.toLowerCase()).length - 1) : 0;
    const dens = words ? (n * k.split(/\s+/).length * 100) / words : 0;
    add("kw-dens", n === 0 ? false : dens > 3 ? "warn" : true, n === 0 ? "Keyword never appears in the text" : `Keyword used ${n}× (${dens.toFixed(1)}%)`, n === 0 ? "Use the keyword naturally in the article." : "Looks stuffed. Aim for under about 2.5%.");
  }
  add("t-len", metaTitle.length >= 30 && metaTitle.length <= 60 ? true : metaTitle.length > 0 ? "warn" : false, `SEO title length: ${metaTitle.length} (aim for 30–60)`, "Google cuts titles off after about 60 characters.");
  add("d-len", metaDesc.length >= 110 && metaDesc.length <= 160 ? true : metaDesc.length > 0 ? "warn" : false, `Meta description length: ${metaDesc.length} (aim for 110–160)`, "Write a clear summary that makes people want to click.");
  add("words", words >= 600 ? true : words >= 300 ? "warn" : false, `Length: ${words} words`, "Posts of 600+ words usually rank better. Under 300 is thin.");
  add("h2", h2 >= 2 ? true : h2 === 1 ? "warn" : false, `${h2} subheading${h2 === 1 ? "" : "s"} (H2)`, "Break the post into sections with at least two H2 subheadings.");
  add("cover", !!p.coverImage, p.coverImage ? "Cover image added" : "Add a cover image", "Used on the blog page and when shared on social media.");
  if (p.coverImage) add("cover-alt", !!p.coverAlt.trim(), p.coverAlt.trim() ? "Cover image has alt text" : "Cover image needs alt text", "Describe the picture in a few words.");
  add("alt", imgs.length === 0 ? "warn" : noAlt === 0, imgs.length === 0 ? "No images in the article" : noAlt === 0 ? `All ${imgs.length} image${imgs.length === 1 ? " has" : "s have"} alt text` : `${noAlt} image${noAlt === 1 ? "" : "s"} missing alt text`, imgs.length === 0 ? "Add at least one image, with alt text." : "Click an image in the editor to add its alt text.");
  add("internal", internal >= 2 ? true : internal === 1 ? "warn" : false, `${internal} internal link${internal === 1 ? "" : "s"}`, "Link to at least two other BrightSun pages or posts. Use the Link to a page button.");
  add("external", external >= 1 ? true : "warn", `${external} external link${external === 1 ? "" : "s"}`, "One link to a trusted outside source adds credibility.");
  add("slug", p.slug.length > 0 && p.slug.length <= 60 ? true : "warn", `Web address: /blogs/${p.slug || "…"}`, "Keep it short and readable.");

  const pts = c.reduce((a, x) => a + (x.level === "good" ? 1 : x.level === "warn" ? 0.5 : 0), 0);
  return { score: Math.round((pts / c.length) * 100), checks: c };
}
