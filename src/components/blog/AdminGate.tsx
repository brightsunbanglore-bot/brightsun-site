"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-[0_24px_60px_-34px_rgba(35,27,24,0.5)]">
      <h1 className="font-hero text-2xl font-extrabold text-espresso">One quick setup step</h1>
      <p className="mt-3 text-espresso/70">To keep the blog editor private, choose a password (at least 8 characters). Open Terminal and run this, with your own password in place of <b>YourPassword123</b>:</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-espresso p-4 text-sm text-ivory">{`cd ~/Desktop/brightsun-site\necho 'ADMIN_PASSWORD=YourPassword123' >> .env.local`}</pre>
      <p className="mt-4 text-espresso/70">Then stop the site (press Control+C in Terminal), start it again with <b>npm run dev</b>, and refresh this page.</p>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not sign in.");
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not sign in.");
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm rounded-3xl bg-white p-8 shadow-[0_24px_60px_-34px_rgba(35,27,24,0.5)]">
      <h1 className="font-hero text-2xl font-extrabold text-espresso">Blog admin</h1>
      <p className="mt-2 text-sm text-espresso/60">Sign in to write and publish blogs.</p>
      <label htmlFor="adm-pw" className="mt-6 block text-xs font-bold uppercase tracking-[0.16em] text-espresso/60">Password</label>
      <input id="adm-pw" type="password" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-espresso/15 bg-ivory px-4 outline-none focus:border-flame focus:ring-4 focus:ring-sun/40" />
      {err && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{err}</p>}
      <button type="submit" disabled={busy || pw.length === 0} className="mt-6 h-12 w-full rounded-full bg-espresso text-sm font-semibold text-ivory transition hover:-translate-y-0.5 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
