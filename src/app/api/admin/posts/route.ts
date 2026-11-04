import { isAdmin } from "@/lib/blog/auth";
import { createPost, listAdmin } from "@/lib/blog/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const no = () => Response.json({ ok: false, error: "Please sign in." }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return no();
  return Response.json({ ok: true, posts: await listAdmin() });
}

export async function POST() {
  if (!(await isAdmin())) return no();
  const post = await createPost();
  return Response.json({ ok: true, post });
}
