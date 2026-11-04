"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Shown only to the signed-in admin, on the public Blogs pages. */
export function AdminBar({ editId }: { editId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/posts", { method: "POST" });
      const d = (await r.json()) as { post?: { id: string } };
      if (d.post) router.push(`/admin/blogs/${d.post.id}`);
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  };
  return (
    <div className="fixed bottom-5 left-1/2 z-[150] flex -translate-x-1/2 items-center gap-2 rounded-full bg-espresso p-1.5 pl-5 text-sm font-semibold text-ivory shadow-[0_20px_50px_-18px_rgba(35,27,24,0.8)]">
      <span className="hidden text-ivory/60 sm:inline">Admin</span>
      {editId && <Link href={`/admin/blogs/${editId}`} className="rounded-full px-3 py-2 hover:bg-white/10">Edit this post</Link>}
      <Link href="/admin/blogs" className="rounded-full px-3 py-2 hover:bg-white/10">Manage blogs</Link>
      <button type="button" onClick={add} disabled={busy} className="rounded-full bg-sun px-5 py-2 font-bold text-espresso disabled:opacity-60">{busy ? "Opening…" : "+ Add blog"}</button>
    </div>
  );
}
