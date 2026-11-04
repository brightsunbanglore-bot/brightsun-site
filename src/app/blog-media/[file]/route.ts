import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS } from "@/lib/blog/store";

export const runtime = "nodejs";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** Serves pictures uploaded in the blog editor. */
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^[a-z0-9][a-z0-9-]*\.(jpg|png|webp|gif)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOADS, file));
    return new Response(new Uint8Array(data), { headers: { "Content-Type": MIME[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
