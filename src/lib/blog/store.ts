import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Post, PostSummary } from "./types";
import { sanitizeHtml } from "./sanitize";
import { slugify, isFuture } from "./text";

/**
 * Posts are plain files: data/blog/posts/<id>.json   Pictures: data/blog/uploads/
 * Back these two folders up and you have backed up the whole blog.
 */
// DATA_DIR (optional) keeps posts, pictures and enquiries outside the app folder so redeploys never touch them.
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const ROOT = path.join(DATA_DIR, "blog");
const POSTS = path.join(ROOT, "posts");
export const UPLOADS = path.join(ROOT, "uploads");

const idOk = (id: string) => /^[a-zA-Z0-9-]{6,64}$/.test(id);
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function ensure() {
  await mkdir(POSTS, { recursive: true });
  await mkdir(UPLOADS, { recursive: true });
}

const summary = (p: Post): PostSummary => ({ id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, coverImage: p.coverImage, coverAlt: p.coverAlt, category: p.category, tags: p.tags, author: p.author, status: p.status, publishedAt: p.publishedAt, updatedAt: p.updatedAt });

export async function readAll(): Promise<Post[]> {
  await ensure();
  const files = (await readdir(POSTS)).filter((f) => f.endsWith(".json"));
  const posts = await Promise.all(
    files.map(async (f) => {
      try {
        return JSON.parse(await readFile(path.join(POSTS, f), "utf8")) as Post;
      } catch {
        return null;
      }
    }),
  );
  return posts.filter((p): p is Post => !!p).sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt));
}

/** Everything the admin sees. */
export async function listAdmin(): Promise<PostSummary[]> {
  return (await readAll()).map(summary);
}

/** A post is live when it is Published and its date has arrived. */
export const isLive = (p: Post) => p.status === "published" && !isFuture(p.publishedAt);

export async function listPublic(): Promise<Post[]> {
  return (await readAll()).filter(isLive);
}

export async function getById(id: string): Promise<Post | null> {
  if (!idOk(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(POSTS, `${id}.json`), "utf8")) as Post;
  } catch {
    return null;
  }
}

export async function getPublicBySlug(slug: string): Promise<Post | null> {
  const p = (await readAll()).find((x) => x.slug === slug);
  return p && isLive(p) ? p : null;
}

export async function createPost(title = "Untitled post"): Promise<Post> {
  await ensure();
  const now = new Date().toISOString();
  const id = randomUUID();
  const base = slugify(title) || "post";
  const slug = await uniqueSlug(base, id);
  const post: Post = {
    id, slug, title, excerpt: "", content: "", coverImage: "", coverAlt: "", category: "", tags: [], author: "Team BrightSun", status: "draft", publishedAt: "", createdAt: now, updatedAt: now,
    seo: { metaTitle: "", metaDescription: "", focusKeyword: "", canonical: "", ogImage: "", noindex: false },
  };
  await write(post);
  return post;
}

async function uniqueSlug(base: string, selfId: string) {
  const all = await readAll();
  let slug = base;
  let n = 2;
  while (all.some((p) => p.slug === slug && p.id !== selfId)) slug = `${base}-${n++}`;
  return slug;
}

async function write(p: Post) {
  await ensure();
  const file = path.join(POSTS, `${p.id}.json`);
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(p, null, 2), "utf8");
  await rename(tmp, file); // never leaves a half-written post
}

export async function updatePost(id: string, body: Partial<Post> & { seo?: Partial<Post["seo"]> }): Promise<Post | null> {
  const cur = await getById(id);
  if (!cur) return null;
  const s: Partial<Post["seo"]> = body.seo || {};
  const status = body.status === "published" ? "published" : body.status === "draft" ? "draft" : cur.status;
  const title = clip(body.title, 200) || cur.title;
  const slug = await uniqueSlug(slugify(clip(body.slug, 100)) || slugify(title) || cur.slug, id);
  let publishedAt = typeof body.publishedAt === "string" ? body.publishedAt : cur.publishedAt;
  if (publishedAt && Number.isNaN(new Date(publishedAt).getTime())) publishedAt = cur.publishedAt;
  if (status === "published" && !publishedAt) publishedAt = new Date().toISOString();
  const tags = Array.isArray(body.tags) ? body.tags.map((t) => clip(t, 40)).filter(Boolean).slice(0, 12) : cur.tags;
  const next: Post = {
    ...cur,
    title, slug, status, publishedAt,
    excerpt: body.excerpt !== undefined ? clip(body.excerpt, 400) : cur.excerpt,
    content: body.content !== undefined ? sanitizeHtml(body.content) : cur.content,
    coverImage: body.coverImage !== undefined ? clip(body.coverImage, 300) : cur.coverImage,
    coverAlt: body.coverAlt !== undefined ? clip(body.coverAlt, 200) : cur.coverAlt,
    category: body.category !== undefined ? clip(body.category, 60) : cur.category,
    author: body.author !== undefined ? clip(body.author, 80) || cur.author : cur.author,
    tags,
    updatedAt: new Date().toISOString(),
    seo: {
      metaTitle: s.metaTitle !== undefined ? clip(s.metaTitle, 120) : cur.seo.metaTitle,
      metaDescription: s.metaDescription !== undefined ? clip(s.metaDescription, 320) : cur.seo.metaDescription,
      focusKeyword: s.focusKeyword !== undefined ? clip(s.focusKeyword, 80) : cur.seo.focusKeyword,
      canonical: s.canonical !== undefined ? clip(s.canonical, 300) : cur.seo.canonical,
      ogImage: s.ogImage !== undefined ? clip(s.ogImage, 300) : cur.seo.ogImage,
      noindex: s.noindex !== undefined ? !!s.noindex : cur.seo.noindex,
    },
  };
  await write(next);
  return next;
}

export async function deletePost(id: string): Promise<boolean> {
  if (!idOk(id)) return false;
  try {
    await unlink(path.join(POSTS, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
