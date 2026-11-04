import { createSign } from "node:crypto";
import { caseStudies } from "@/data/caseStudies";

/**
 * Live Google Search Console data for the homepage case studies.
 *   GET /api/gsc?slug=suprameds  ->  last 3 months, ending 2 days ago (GSC's data lag)
 *
 * Setup (once):
 *  1. Google Cloud: enable the "Search Console API" and create a service account + JSON key.
 *  2. In Search Console, add the service account's email as a user (Restricted) on each property.
 *  3. Set env vars:  GSC_CLIENT_EMAIL  and  GSC_PRIVATE_KEY  (the key, with \n for line breaks).
 * Without them this route returns 503 and the page falls back to its saved data.
 * The response is cached for a day, so the chart refreshes automatically every day.
 */
export const revalidate = 86400;

const b64 = (v: string | Buffer) => Buffer.from(v).toString("base64url");

async function accessToken(email: string, key: string) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(key.replace(/\\n/g, "\n"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64(sig)}` }),
  });
  if (!res.ok) throw new Error("token");
  return (await res.json()).access_token as string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const study = caseStudies.find((s) => s.slug === slug);
  const email = process.env.GSC_CLIENT_EMAIL;
  const key = process.env.GSC_PRIVATE_KEY;
  if (!study?.gscProperty || !email || !key) return Response.json({ error: "not configured" }, { status: 503 });
  try {
    const token = await accessToken(email, key);
    const end = new Date(Date.now() - 2 * 864e5);
    const start = new Date(end.getTime() - 90 * 864e5);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(study.gscProperty)}/searchAnalytics/query`;
    const q = (dimensions: string[]) =>
      fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: iso(start), endDate: iso(end), dimensions, rowLimit: 200 }),
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("gsc"))));
    const [daily, total] = await Promise.all([q(["date"]), q([])]);
    const byDate = new Map<string, { clicks: number; impressions: number }>(
      (daily.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number }) => [r.keys[0], r]),
    );
    const clicks: number[] = [];
    const impressions: number[] = [];
    for (let t = start.getTime(); t <= end.getTime(); t += 864e5) {
      const r = byDate.get(iso(new Date(t)));
      clicks.push(r?.clicks ?? 0);
      impressions.push(r?.impressions ?? 0);
    }
    const tot = total.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    return Response.json(
      { from: iso(start), to: iso(end), clicks, impressions, totals: { clicks: tot.clicks, impressions: tot.impressions, ctr: tot.ctr * 100, position: tot.position } },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } },
    );
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
