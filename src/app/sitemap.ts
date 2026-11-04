import type { MetadataRoute } from "next";
import { listPublic } from "@/lib/blog/store";
import { SITE_URL } from "@/lib/blog/text";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/about", "/services", "/work", "/blogs", "/contact"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
  const posts = (await listPublic()).filter((p) => !p.seo.noindex).map((p) => ({ url: `${SITE_URL}/blogs/${p.slug}`, lastModified: new Date(p.updatedAt) }));
  return [...pages, ...posts];
}
