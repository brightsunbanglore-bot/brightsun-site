import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { isAdmin } from "@/lib/blog/auth";
import { UPLOADS } from "@/lib/blog/store";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 6 * 1024 * 1024;

/** Looks at the first bytes, so a renamed non-image file is refused. */
function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "webp";
  if (b.subarray(0, 3).toString() === "GIF") return "gif";
  return null;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "Please sign in." }, { status: 401 });
  let file: File | null = null;
  try {
    const fd = await req.formData();
    const f = fd.get("file");
    if (f instanceof File) file = f;
  } catch {
    /* handled below */
  }
  if (!file) return Response.json({ ok: false, error: "No picture received." }, { status: 400 });
  if (!TYPES[file.type]) return Response.json({ ok: false, error: "Please use a JPG, PNG, WebP or GIF picture." }, { status: 400 });
  if (file.size > MAX) return Response.json({ ok: false, error: "That picture is over 6 MB. Please shrink it first." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return Response.json({ ok: false, error: "That file is not a real picture." }, { status: 400 });
  const base = (file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)) || "image";
  const name = `${base}-${randomBytes(4).toString("hex")}.${ext}`;
  await mkdir(UPLOADS, { recursive: true });
  await writeFile(path.join(UPLOADS, name), buf);
  return Response.json({ ok: true, url: `/blog-media/${name}` });
}
