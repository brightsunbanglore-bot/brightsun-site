import { isAdmin } from "@/lib/blog/auth";
import { deletePost, getById, updatePost } from "@/lib/blog/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const no = () => Response.json({ ok: false, error: "Please sign in." }, { status: 401 });
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  if (!(await isAdmin())) return no();
  const post = await getById((await params).id);
  return post ? Response.json({ ok: true, post }) : Response.json({ ok: false, error: "Not found" }, { status: 404 });
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return no();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const post = await updatePost((await params).id, body as Parameters<typeof updatePost>[1]);
  return post ? Response.json({ ok: true, post }) : Response.json({ ok: false, error: "Not found" }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!(await isAdmin())) return no();
  return (await deletePost((await params).id)) ? Response.json({ ok: true }) : Response.json({ ok: false, error: "Not found" }, { status: 404 });
}
