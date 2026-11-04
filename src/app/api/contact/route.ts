import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/blog/store";

/**
 * Contact form endpoint.  POST /api/contact  { name, phone, email?, services?, budget?, message?, company? }
 *
 * Where the enquiry goes:
 *  - If CONTACT_WEBHOOK_URL is set (a Zapier / Make / Google Apps Script / Slack-style URL), the enquiry is
 *    forwarded there as JSON.
 *  - Otherwise it is saved to data/leads.jsonl in the project (one JSON line per enquiry), which is fine
 *    for local use. Before going live, set CONTACT_WEBHOOK_URL (or connect an email service here).
 * `company` is a hidden "honeypot" field: real visitors never fill it, bots do, and those are ignored.
 */
export const runtime = "nodejs";

type Body = { name?: string; phone?: string; email?: string; services?: string[]; budget?: string; message?: string; company?: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (clean(body.company, 100)) return Response.json({ ok: true }); // bot: pretend it worked

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 160);
  const message = clean(body.message, 3000);
  const budget = clean(body.budget, 60);
  const services = Array.isArray(body.services) ? body.services.map((s) => clean(s, 60)).filter(Boolean).slice(0, 10) : [];

  if (name.length < 2) return Response.json({ ok: false, error: "Please tell us your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return Response.json({ ok: false, error: "Please enter a valid phone number." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });

  const lead = { receivedAt: new Date().toISOString(), name, phone, email, services, budget, message };

  try {
    const hook = process.env.CONTACT_WEBHOOK_URL;
    if (hook) {
      const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
      if (!r.ok) throw new Error(`webhook ${r.status}`);
    } else {
      const dir = DATA_DIR;
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(lead) + "\n", "utf8");
    }
  } catch (e) {
    console.error("[contact] could not save enquiry", e);
    return Response.json({ ok: false, error: "Something went wrong on our side. Please message us on WhatsApp." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
