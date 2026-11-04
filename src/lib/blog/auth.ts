import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin sign-in. The password lives in the ADMIN_PASSWORD setting (file .env.local), never in the code.
 * After signing in, a signed cookie (7 days) proves it. No password set = admin stays locked.
 */
export const COOKIE = "bs_admin";
const WEEK = 60 * 60 * 24 * 7;

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8;

const secret = () => `bs-admin::${process.env.ADMIN_PASSWORD}`;
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export function passwordMatches(input: string): boolean {
  const real = process.env.ADMIN_PASSWORD || "";
  const a = Buffer.from(createHmac("sha256", "cmp").update(input).digest("hex"));
  const b = Buffer.from(createHmac("sha256", "cmp").update(real).digest("hex"));
  return adminConfigured() && timingSafeEqual(a, b);
}

export function makeToken(): string {
  const exp = String(Date.now() + WEEK * 1000);
  return `${exp}.${sign(exp)}`;
}

function valid(token?: string): boolean {
  if (!token || !adminConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

export async function isAdmin(): Promise<boolean> {
  return valid((await cookies()).get(COOKIE)?.value);
}

export const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: WEEK };
