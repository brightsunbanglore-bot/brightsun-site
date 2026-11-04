"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostSummary } from "@/lib/blog/types";
import { formatDate, isFuture } from "@/lib/blog/text";

const badge = (p: PostSummary) =>
  p.status === "draft"
    ? { t: "Draft", c: "bg-espresso/10 text-espresso/70" }
    : isFuture(p.publishedAt)
      ? { t: "Scheduled", c: "bg-sun/40 text-espresso" }
      : { t: "Published", c: "bg-emerald-100 text-emerald-800" };

export function PostList({ initial }: { initial: PostSummary[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const add = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/posts", { method: "POST" });
      const d = (await r.json()) as { ok?: boolean; post?: { id: string }; error?: string };
      if (!r.ok || !d.post) throw new Error(d.error || "Could not create the post.");
      router.push(`/admin/blogs/${d.post.id}`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong.");
      setBusy(false);
    }
  };
  const del = async (p: PostSummary) => {
    if (!window.confirm(`Delete "${p.title}" for good? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/posts/${p.id}`, { method: "DELETE" });
    if (r.ok) setPosts((x) => x.filter((y) => y.id !== p.id));
    else setErr("Could not delete that post.");
  };
  const out = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-hero text-3xl font-extrabold tracking-[-0.03em] text-espresso">Blogs</h1>
          <p className="mt-1 text-sm text-espresso/60">{posts.length} post{posts.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/blogs" target="_blank" className="text-sm font-semibold text-espresso underline decoration-sun decoration-2 underline-offset-4 hover:text-flame">View blogs page</Link>
          <button type="button" onClick={out} className="text-sm font-semibold text-espresso/60 hover:text-flame">Sign out</button>
          <button type="button" onClick={add} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-espresso px-6 text-sm font-semibold text-ivory transition hover:-translate-y-0.5 disabled:opacity-60">
            <span aria-hidden className="text-lg leading-none">+</span> {busy ? "Opening editor…" : "Add blog"}
          </button>
        </div>
      </div>
      {err && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{err}</p>}

      <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-34px_rgba(35,27,24,0.5)]">
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-hero text-xl font-extrabold text-espresso">No blogs yet</p>
            <p className="mt-2 text-sm text-espresso/60">Click <b>Add blog</b> to write your first one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-espresso/10">
            {posts.map((p) => {
              const b = badge(p);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-4 md:p-5">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.coverImage && <img src={p.coverImage} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/blogs/${p.id}`} className="block truncate font-hero text-lg font-bold text-espresso hover:text-flame">{p.title}</Link>
                    <p className="mt-0.5 truncate text-xs text-espresso/55">/blogs/{p.slug} · {p.category || "No category"} · {p.status === "published" ? formatDate(p.publishedAt) : `Edited ${formatDate(p.updatedAt)}`}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${b.c}`}>{b.t}</span>
                  <div className="flex items-center gap-3 text-sm font-semibold">
                    <Link href={`/admin/blogs/${p.id}`} className="text-espresso hover:text-flame">Edit</Link>
                    {b.t === "Published" && <Link href={`/blogs/${p.slug}`} target="_blank" className="text-espresso hover:text-flame">View</Link>}
                    <button type="button" onClick={() => del(p)} className="text-red-700/80 hover:text-red-700">Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
