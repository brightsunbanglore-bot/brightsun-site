import { cookies } from "next/headers";
import { COOKIE, adminConfigured, cookieOptions, makeToken, passwordMatches } from "@/lib/blog/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminConfigured()) return Response.json({ ok: false, error: "Admin is not set up yet. Add ADMIN_PASSWORD to .env.local." }, { status: 503 });
  let pw = "";
  try {
    pw = String(((await req.json()) as { password?: string }).password || "");
  } catch {
    /* empty */
  }
  if (!passwordMatches(pw)) {
    await new Promise((r) => setTimeout(r, 700)); // slows down password guessing
    return Response.json({ ok: false, error: "That password is not right." }, { status: 401 });
  }
  (await cookies()).set(COOKIE, makeToken(), cookieOptions);
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return Response.json({ ok: true });
}
