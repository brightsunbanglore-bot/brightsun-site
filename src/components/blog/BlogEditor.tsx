"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import type { Post } from "@/lib/blog/types";
import { analyse } from "@/lib/blog/seo";
import { sanitizeHtml } from "@/lib/blog/sanitize";
import { SITE_URL, isFuture, slugify, wordCount } from "@/lib/blog/text";

const PAGES = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Our Work", href: "/work" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

const inp = "h-11 w-full rounded-xl border border-espresso/15 bg-white px-3.5 text-sm text-espresso outline-none transition focus:border-flame focus:ring-4 focus:ring-sun/40";
const area = "w-full rounded-xl border border-espresso/15 bg-white px-3.5 py-2.5 text-sm text-espresso outline-none transition focus:border-flame focus:ring-4 focus:ring-sun/40";
const lab = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-espresso/60";

const toLocal = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div data-lenis-prevent className="fixed inset-0 z-[500] flex items-center justify-center bg-espresso/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label={title} className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-hero text-xl font-extrabold text-espresso">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-espresso/50 hover:text-espresso">×</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** One consistent icon family (24px grid, 1.7 stroke, round ends). */
const I: Record<string, ReactNode> = {
  h2: <><path d="M4 5v14M12 5v14M4 12h8" /><path d="M16 10.2c.4-1 1.2-1.5 2.2-1.5 1.3 0 2.1.8 2.1 1.9 0 2.2-4.3 3.3-4.3 6.4h4.5" /></>,
  h3: <><path d="M4 5v14M12 5v14M4 12h8" /><path d="M16 9.2c.5-.4 1.1-.6 1.8-.6 1.2 0 2 .7 2 1.6s-.8 1.6-1.9 1.6c1.200 0 2.100.700 2.100 1.700s-.9 1.800-2.200 1.800c-.800 0-1.500-.3-2-.8" /></>,
  p: <><path d="M13 4.5H9.5a3.5 3.5 0 0 0 0 7H13" /><path d="M13 4.5v15M17 4.5v15" /></>,
  bold: <path d="M7 5h5.2a3.3 3.3 0 0 1 0 6.600H7zM7 11.600h6a3.700 3.700 0 0 1 0 7.400H7z" />,
  italic: <path d="M10 5h7M7 19h7M14.500 5l-5 14" />,
  underline: <><path d="M7 4.500v6.500a5 5 0 0 0 10 0V4.500" /><path d="M5 20h14" /></>,
  ul: <><path d="M9.500 6.500H20M9.500 12H20M9.500 17.500H20" /><circle cx="4.800" cy="6.500" r="1" fill="currentColor" stroke="none" /><circle cx="4.800" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4.800" cy="17.500" r="1" fill="currentColor" stroke="none" /></>,
  ol: <><path d="M10 6.500h10M10 12h10M10 17.500h10" /><path d="M4 5.200l1.300-.8v4M4 14.500c0-1 .8-1.500 1.600-1.500.9 0 1.400.6 1.400 1.300 0 1.600-3 2.300-3 4H7M4 16.500" /></>,
  quote: <><path d="M5 17.500c-1-.9-1.500-2-1.500-3.500 0-3 2-5.300 4.500-6.500M14 17.500c-1-.9-1.500-2-1.500-3.500 0-3 2-5.300 4.500-6.500" /><path d="M3.500 14H8v4.500H3.500zM12.500 14H17v4.500h-4.500z" /></>,
  hr: <><path d="M4 12h16" /><path d="M8 6.500h8M8 17.500h8" opacity=".45" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1" /><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1" /></>,
  unlink: <><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1" /><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1" /><path d="M3 3l18 18" /></>,
  image: <><rect x="3.500" y="4.500" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.600" /><path d="M4 17.500l4.800-4.600a1.800 1.800 0 0 1 2.500 0L14 15.500l2-2a1.800 1.800 0 0 1 2.500 0L20.500 15.500" /></>,
  search: <><circle cx="10.500" cy="10.500" r="6" /><path d="M15 15l5 5M8.500 10.500h4" /></>,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10.500a5.500 5.500 0 0 1 0 11H11" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H9.500a5.500 5.500 0 0 0 0 11H13" /></>,
  clear: <><path d="M6 5h12M12 5v14M9 19h6" /><path d="M4 4l16 16" /></>,
};

function Ico({ n }: { n: string }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {I[n]}
    </svg>
  );
}

type TB = { id: string; icon: string; title: string; run: () => void; active?: boolean; busy?: boolean };

export function BlogEditor({ initial }: { initial: Post }) {
  const [title, setTitle] = useState(initial.title === "Untitled post" ? "" : initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const slugTouched = useRef(initial.status === "published");
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [content, setContent] = useState(initial.content);
  const [coverImage, setCoverImage] = useState(initial.coverImage);
  const [coverAlt, setCoverAlt] = useState(initial.coverAlt);
  const [category, setCategory] = useState(initial.category);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [author, setAuthor] = useState(initial.author);
  const [status, setStatus] = useState(initial.status);
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);
  const [metaTitle, setMetaTitle] = useState(initial.seo.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.seo.metaDescription);
  const [focusKeyword, setFocusKeyword] = useState(initial.seo.focusKeyword);
  const [canonical, setCanonical] = useState(initial.seo.canonical);
  const [ogImage, setOgImage] = useState(initial.seo.ogImage);
  const [noindex, setNoindex] = useState(initial.seo.noindex);

  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ t: string; bad?: boolean } | null>(null);
  const [modal, setModal] = useState<null | "link" | "alt">(null);
  const [linkQ, setLinkQ] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [posts, setPosts] = useState<{ label: string; href: string }[]>([]);
  const [altVal, setAltVal] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tab, setTab] = useState<"seo" | "cover" | "details">("seo");

  // find & replace
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, ul: false, ol: false, h2: false, h3: false, quote: false, link: false });
  const [fOpen, setFOpen] = useState(false);
  const [fQ, setFQ] = useState("");
  const [fR, setFR] = useState("");
  const [fCase, setFCase] = useState(false);
  const [fWord, setFWord] = useState(false);
  const [fIdx, setFIdx] = useState(0);
  const [fCount, setFCount] = useState(0);
  const fInput = useRef<HTMLInputElement>(null);

  const ed = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);
  const altTarget = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mounted) return;
    if (ed.current) ed.current.innerHTML = initial.content || "<p><br></p>";
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* ignore */ }
  }, [initial.content, mounted]);

  const touch = () => setDirty(true);
  useEffect(() => {
    const on = () => {
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode || !ed.current?.contains(sel.anchorNode)) return;
      const q = (c: string) => { try { return document.queryCommandState(c); } catch { return false; } };
      let blk = "";
      try { blk = document.queryCommandValue("formatBlock").toLowerCase().replace(/[<>]/g, ""); } catch { /* ignore */ }
      const el = sel.anchorNode.nodeType === 1 ? (sel.anchorNode as Element) : sel.anchorNode.parentElement;
      setFmt({ bold: q("bold"), italic: q("italic"), underline: q("underline"), ul: q("insertUnorderedList"), ol: q("insertOrderedList"), h2: blk === "h2", h3: blk === "h3", quote: blk === "blockquote", link: !!el?.closest("a") });
    };
    document.addEventListener("selectionchange", on);
    return () => document.removeEventListener("selectionchange", on);
  }, []);
  const sync = useCallback(() => {
    if (ed.current) setContent(ed.current.innerHTML);
    setDirty(true);
  }, []);

  const saveSel = () => {
    const s = window.getSelection();
    if (s && s.rangeCount && ed.current?.contains(s.anchorNode)) saved.current = s.getRangeAt(0).cloneRange();
  };
  const restoreSel = () => {
    ed.current?.focus();
    const s = window.getSelection();
    if (s && saved.current) {
      s.removeAllRanges();
      s.addRange(saved.current);
    }
  };
  const exec = (cmd: string, val?: string) => {
    ed.current?.focus();
    document.execCommand(cmd, false, val);
    sync();
  };
  const block = (tag: string) => {
    const cur = document.queryCommandValue("formatBlock").toLowerCase().replace(/[<>]/g, "");
    exec("formatBlock", `<${cur === tag ? "p" : tag}>`);
  };

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!r.ok || !d.url) throw new Error(d.error || "Upload failed.");
      return d.url;
    } catch (ex) {
      setNote({ t: ex instanceof Error ? ex.message : "Upload failed.", bad: true });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const insertImage = async (file: File) => {
    const url = await upload(file);
    if (!url) return;
    restoreSel();
    document.execCommand("insertHTML", false, `<p><img src="${url}" alt=""></p><p><br></p>`);
    sync();
    const img = ed.current?.querySelector<HTMLImageElement>(`img[src="${url}"]`) || null;
    if (img) openAlt(img);
  };

  const openAlt = (img: HTMLImageElement) => {
    altTarget.current = img;
    setAltVal(img.getAttribute("alt") || "");
    setModal("alt");
  };

  const openLink = async () => {
    saveSel();
    setLinkQ("");
    setLinkUrl("");
    setModal("link");
    try {
      const r = await fetch("/api/admin/posts");
      const d = (await r.json()) as { posts?: { title: string; slug: string; status: string }[] };
      setPosts((d.posts || []).filter((p) => p.status === "published" && p.slug !== slug).map((p) => ({ label: p.title, href: `/blogs/${p.slug}` })));
    } catch { /* the page list still works */ }
  };

  const applyLink = (href: string, label?: string) => {
    setModal(null);
    restoreSel();
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) document.execCommand("insertHTML", false, `<a href="${href.replace(/"/g, "&quot;")}">${(label || href).replace(/</g, "&lt;")}</a>&nbsp;`);
    else document.execCommand("createLink", false, href);
    sync();
  };

  const onPaste = async (e: ReactClipboardEvent) => {
    const img = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      saveSel();
      await insertImage(img);
      return;
    }
    const html = e.clipboardData.getData("text/html");
    if (html) {
      e.preventDefault();
      document.execCommand("insertHTML", false, sanitizeHtml(html));
      sync();
    }
  };

  /** Every match of the search text inside the post, as live Ranges (nothing in the post is changed). */
  const findRanges = useCallback((): Range[] => {
    const root = ed.current;
    if (!root || !fQ) return [];
    const nodes: { n: Text; start: number }[] = [];
    let full = "";
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      nodes.push({ n: n as Text, start: full.length });
      full += (n as Text).data;
      const el = (n as Text).parentElement;
      if (el && /^(P|H[1-6]|LI|BLOCKQUOTE|TD|TH|FIGCAPTION)$/.test(el.tagName) && !n.nextSibling) full += "\n"; // keep words in different paragraphs apart
    }
    const esc = fQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(fWord ? `\\b${esc}\\b` : esc, fCase ? "g" : "gi");
    const out: Range[] = [];
    const locate = (off: number, end: boolean) => {
      for (let i = 0; i < nodes.length; i++) {
        const { n, start } = nodes[i];
        const stop = start + n.data.length;
        if (off < stop || (end && off === stop)) return { n, o: off - start };
      }
      return null;
    };
    let m: RegExpExecArray | null;
    while ((m = re.exec(full)) && out.length < 5000) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      const a = locate(m.index, false);
      const b = locate(m.index + m[0].length, true);
      if (a && b) {
        const r = document.createRange();
        r.setStart(a.n, a.o);
        r.setEnd(b.n, b.o);
        out.push(r);
      }
    }
    return out;
  }, [fQ, fCase, fWord]);

  useEffect(() => {
    const css = (typeof CSS !== "undefined" ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights : undefined);
    const H = (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
    if (!fOpen || !fQ) {
      setFCount(0);
      css?.delete("bs-find");
      css?.delete("bs-find-cur");
      return;
    }
    const rs = findRanges();
    setFCount(rs.length);
    const cur = Math.min(fIdx, Math.max(0, rs.length - 1));
    if (css && H) {
      css.set("bs-find", new H(...rs.filter((_, i) => i !== cur)));
      css.set("bs-find-cur", new H(...(rs[cur] ? [rs[cur]] : [])));
    }
    return () => {
      css?.delete("bs-find");
      css?.delete("bs-find-cur");
    };
  }, [fOpen, fQ, fIdx, content, findRanges]);

  const goTo = (i: number) => {
    const rs = findRanges();
    if (!rs.length) return;
    const n = ((i % rs.length) + rs.length) % rs.length;
    setFIdx(n);
    rs[n].startContainer.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const replaceRange = (r: Range) => {
    ed.current?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    document.execCommand("insertText", false, fR);
  };
  const replaceOne = () => {
    const rs = findRanges();
    if (!rs.length) return;
    const i = Math.min(fIdx, rs.length - 1);
    replaceRange(rs[i]);
    sync();
    setTimeout(() => goTo(i), 0);
  };
  const replaceAll = () => {
    const rs = findRanges();
    if (!rs.length) return;
    if (rs.length > 1 && !window.confirm(`Replace all ${rs.length} matches?`)) return;
    // work from the end so earlier matches stay where they are
    for (let i = rs.length - 1; i >= 0; i--) {
      const fresh = findRanges();
      if (fresh[i]) replaceRange(fresh[i]);
    }
    sync();
    setNote({ t: `Replaced ${rs.length} match${rs.length === 1 ? "" : "es"}` });
  };
  const openFind = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length < 80 && !sel.includes("\n")) setFQ(sel);
    setFOpen(true);
    setFIdx(0);
    setTimeout(() => { fInput.current?.focus(); fInput.current?.select(); }, 0);
  };
  const closeFind = () => {
    setFOpen(false);
    ed.current?.focus();
  };

  const seo = useMemo(
    () => analyse({ title, slug, excerpt, content, coverImage, coverAlt, seo: { metaTitle, metaDescription, focusKeyword } }),
    [title, slug, excerpt, content, coverImage, coverAlt, metaTitle, metaDescription, focusKeyword],
  );

  const persist = useCallback(
    async (nextStatus: "draft" | "published", verb: string) => {
      if (!title.trim()) {
        setNote({ t: "Please add a title first.", bad: true });
        return;
      }
      const html = ed.current?.innerHTML ?? content;
      if (nextStatus === "published") {
        if (wordCount(html) < 50) {
          setNote({ t: "Write a little more before publishing (at least 50 words).", bad: true });
          return;
        }
        if (seo.score < 60 && !window.confirm(`The SEO score is ${seo.score}/100. Publish anyway?`)) return;
      }
      setBusy(true);
      setNote(null);
      try {
        const r = await fetch(`/api/admin/posts/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, slug, excerpt, content: html, coverImage, coverAlt, category, author, status: nextStatus, publishedAt,
            tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
            seo: { metaTitle, metaDescription, focusKeyword, canonical, ogImage, noindex },
          }),
        });
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; post?: Post; error?: string };
        if (!r.ok || !d.post) throw new Error(d.error || (r.status === 401 ? "You were signed out. Refresh the page and sign in again." : "Could not save."));
        setSlug(d.post.slug);
        setStatus(d.post.status);
        setPublishedAt(d.post.publishedAt);
        setDirty(false);
        setNote({ t: `${verb} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
      } catch (ex) {
        setNote({ t: ex instanceof Error ? ex.message : "Could not save.", bad: true });
      } finally {
        setBusy(false);
      }
    },
    [title, slug, excerpt, content, coverImage, coverAlt, category, author, publishedAt, tagsText, metaTitle, metaDescription, focusKeyword, canonical, ogImage, noindex, initial.id, seo.score],
  );

  // Cmd/Ctrl+S saves, and leaving with unsaved work asks first
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const openFindRef = useRef(openFind);
  openFindRef.current = openFind;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        openFindRef.current();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        persistRef.current(status, status === "published" ? "Updated" : "Draft saved");
      }
    };
    const b = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", k);
    window.addEventListener("beforeunload", b);
    return () => {
      window.removeEventListener("keydown", k);
      window.removeEventListener("beforeunload", b);
    };
  }, [status, dirty]);

  const live = status === "published" && !isFuture(publishedAt);
  const scheduled = status === "published" && isFuture(publishedAt);
  const words = wordCount(content);
  const tools: TB[][] = [
    [
      { id: "h2", icon: "h2", title: "Big heading", run: () => block("h2"), active: fmt.h2 },
      { id: "h3", icon: "h3", title: "Small heading", run: () => block("h3"), active: fmt.h3 },
      { id: "p", icon: "p", title: "Normal text", run: () => exec("formatBlock", "<p>") },
    ],
    [
      { id: "b", icon: "bold", title: "Bold (Cmd+B)", run: () => exec("bold"), active: fmt.bold },
      { id: "i", icon: "italic", title: "Italic (Cmd+I)", run: () => exec("italic"), active: fmt.italic },
      { id: "u", icon: "underline", title: "Underline (Cmd+U)", run: () => exec("underline"), active: fmt.underline },
    ],
    [
      { id: "ul", icon: "ul", title: "Bulleted list", run: () => exec("insertUnorderedList"), active: fmt.ul },
      { id: "ol", icon: "ol", title: "Numbered list", run: () => exec("insertOrderedList"), active: fmt.ol },
      { id: "q", icon: "quote", title: "Quote", run: () => block("blockquote"), active: fmt.quote },
      { id: "hr", icon: "hr", title: "Divider line", run: () => exec("insertHorizontalRule") },
    ],
    [
      { id: "link", icon: "link", title: "Link to a page or web address", run: openLink, active: fmt.link },
      { id: "unlink", icon: "unlink", title: "Remove link", run: () => exec("unlink") },
      { id: "img", icon: "image", title: uploading ? "Uploading…" : "Add a picture", run: () => { saveSel(); fileRef.current?.click(); }, busy: uploading },
    ],
    [
      { id: "find", icon: "search", title: "Find & replace (Cmd+F)", run: openFind, active: fOpen },
    ],
    [
      { id: "undo", icon: "undo", title: "Undo (Cmd+Z)", run: () => exec("undo") },
      { id: "redo", icon: "redo", title: "Redo (Cmd+Shift+Z)", run: () => exec("redo") },
      { id: "clr", icon: "clear", title: "Clear formatting", run: () => exec("removeFormat") },
    ],
  ];

  const filteredLinks = [...PAGES, ...posts].filter((x) => x.label.toLowerCase().includes(linkQ.toLowerCase()) || x.href.includes(linkQ.toLowerCase()));
  const shownTitle = (metaTitle || title || "Your post title").slice(0, 70);
  const shownDesc = (metaDescription || excerpt || "Your meta description will appear here.").slice(0, 170);
  const ring = seo.score >= 80 ? "bg-emerald-500" : seo.score >= 60 ? "bg-sun" : "bg-red-500";

  const TABS: { id: "seo" | "cover" | "details"; label: string }[] = [
    { id: "seo", label: `SEO · ${seo.score}` },
    { id: "cover", label: "Cover image" },
    { id: "details", label: "Details" },
  ];

  const ui = (
    <div className="fixed inset-0 z-[400] flex flex-col bg-cream">
      {/* top bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-espresso/10 bg-white px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/blogs" className="text-sm font-semibold text-espresso/70 hover:text-flame">← All blogs</Link>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${live ? "bg-emerald-100 text-emerald-800" : scheduled ? "bg-sun/40 text-espresso" : "bg-espresso/10 text-espresso/70"}`}>{live ? "Published" : scheduled ? "Scheduled" : "Draft"}</span>
          {dirty && <span className="text-xs font-semibold text-flame">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {note && <span role="status" className={`text-sm font-semibold ${note.bad ? "text-red-700" : "text-emerald-700"}`}>{note.t}</span>}
          {live && <Link href={`/blogs/${slug}`} target="_blank" className="text-sm font-semibold text-espresso underline decoration-sun decoration-2 underline-offset-4 hover:text-flame">View post</Link>}
          {status === "published" ? (
            <>
              <button type="button" disabled={busy} onClick={() => persist("draft", "Moved back to draft")} className="h-10 rounded-full border border-espresso/20 px-5 text-sm font-semibold text-espresso hover:border-flame disabled:opacity-60">Unpublish</button>
              <button type="button" disabled={busy} onClick={() => persist("published", "Updated")} className="h-10 rounded-full bg-espresso px-6 text-sm font-semibold text-ivory hover:-translate-y-0.5 disabled:opacity-60">{busy ? "Saving…" : "Update"}</button>
            </>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => persist("draft", "Draft saved")} className="h-10 rounded-full border border-espresso/20 px-5 text-sm font-semibold text-espresso hover:border-flame disabled:opacity-60">{busy ? "Saving…" : "Save draft"}</button>
              <button type="button" disabled={busy} onClick={() => persist("published", isFuture(publishedAt) ? "Scheduled" : "Published")} className="h-10 rounded-full bg-sun px-6 text-sm font-bold text-espresso shadow-[0_12px_28px_-14px_rgba(255,138,29,0.8)] hover:-translate-y-0.5 disabled:opacity-60">Publish</button>
            </>
          )}
        </div>
      </div>

      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[1fr_400px] lg:overflow-hidden">
        <div data-lenis-prevent className="min-w-0 lg:overflow-y-auto"><div className="mx-auto max-w-4xl space-y-4 px-4 py-6 md:px-8">
        {fOpen && (
          <div role="search" aria-label="Find and replace" className="sticky top-3 z-40 ml-auto w-full max-w-[26rem] rounded-2xl border border-espresso/10 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(35,27,24,0.6)]">
            <div className="flex items-center gap-2">
              <input
                ref={fInput}
                aria-label="Find"
                value={fQ}
                onChange={(e) => { setFQ(e.target.value); setFIdx(0); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); goTo(fIdx + (e.shiftKey ? -1 : 1)); }
                  if (e.key === "Escape") closeFind();
                }}
                placeholder="Find"
                className="h-10 min-w-0 flex-1 rounded-lg border border-espresso/15 bg-ivory px-3 text-sm outline-none focus:border-flame"
              />
              <span aria-live="polite" className="w-14 shrink-0 text-center text-xs font-semibold text-espresso/60">{fQ ? (fCount ? `${Math.min(fIdx, fCount - 1) + 1} of ${fCount}` : "0 found") : ""}</span>
              <button type="button" aria-label="Previous match" onClick={() => goTo(fIdx - 1)} disabled={!fCount} className="h-9 w-9 rounded-lg text-espresso hover:bg-sun/40 disabled:opacity-30">↑</button>
              <button type="button" aria-label="Next match" onClick={() => goTo(fIdx + 1)} disabled={!fCount} className="h-9 w-9 rounded-lg text-espresso hover:bg-sun/40 disabled:opacity-30">↓</button>
              <button type="button" aria-label="Close find and replace" onClick={closeFind} className="h-9 w-9 rounded-lg text-lg text-espresso/60 hover:bg-espresso/10">×</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                aria-label="Replace with"
                value={fR}
                onChange={(e) => setFR(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); replaceOne(); } if (e.key === "Escape") closeFind(); }}
                placeholder="Replace with"
                className="h-10 min-w-0 flex-1 rounded-lg border border-espresso/15 bg-ivory px-3 text-sm outline-none focus:border-flame"
              />
              <button type="button" onClick={replaceOne} disabled={!fCount} className="h-10 rounded-lg border border-espresso/20 px-3 text-sm font-semibold text-espresso hover:border-flame disabled:opacity-40">Replace</button>
              <button type="button" onClick={replaceAll} disabled={!fCount} className="h-10 rounded-lg bg-espresso px-3 text-sm font-semibold text-ivory disabled:opacity-40">Replace all</button>
            </div>
            <div className="mt-2 flex gap-4 px-1 text-xs font-semibold text-espresso/70">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={fCase} onChange={(e) => { setFCase(e.target.checked); setFIdx(0); }} className="accent-espresso" /> Match case</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={fWord} onChange={(e) => { setFWord(e.target.checked); setFIdx(0); }} className="accent-espresso" /> Whole word</label>
            </div>
          </div>
        )}
          <input
            aria-label="Post title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched.current) setSlug(slugify(e.target.value));
              touch();
            }}
            placeholder="Post title"
            className="w-full rounded-2xl border border-transparent bg-white px-5 py-4 font-hero text-3xl font-extrabold tracking-[-0.03em] text-espresso outline-none placeholder:text-espresso/30 focus:border-flame md:text-4xl"
          />
          <div className="flex flex-wrap items-center gap-2 px-1 text-sm text-espresso/60">
            <span>{SITE_URL.replace(/^https?:\/\//, "")}/blogs/</span>
            <input aria-label="Web address" value={slug} onChange={(e) => { slugTouched.current = true; setSlug(slugify(e.target.value)); touch(); }} className="h-9 min-w-[12rem] flex-1 rounded-lg border border-espresso/15 bg-white px-3 text-sm text-espresso outline-none focus:border-flame" />
          </div>

          <div className="rounded-2xl bg-white shadow-[0_18px_46px_-30px_rgba(35,27,24,0.55)]">
            <div role="toolbar" aria-label="Formatting" className="sticky top-[-1.5rem] z-20 flex flex-wrap items-center gap-2 rounded-t-2xl border-b border-espresso/10 bg-white/90 px-3 py-2.5 backdrop-blur">
              {tools.map((g, gi) => (
                <div key={gi} className="flex items-center gap-0.5 rounded-xl bg-cream/70 p-1 ring-1 ring-espresso/[0.06]">
                  {g.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={t.title}
                      aria-pressed={t.active ? true : undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={t.run}
                      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg transition duration-150 ${t.active ? "bg-espresso text-sun shadow-[0_6px_14px_-8px_rgba(35,27,24,0.9)]" : "text-espresso/75 hover:bg-white hover:text-espresso hover:shadow-[0_6px_16px_-10px_rgba(35,27,24,0.6)]"} ${t.busy ? "animate-pulse" : ""}`}
                    >
                      <Ico n={t.icon} />
                      <span role="tooltip" className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-espresso px-2 py-1 text-[11px] font-semibold text-ivory opacity-0 shadow-lg transition delay-300 group-hover:opacity-100">{t.title}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div
              ref={ed}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Post body"
              data-placeholder="Start writing your post here…"
              onInput={sync}
              onPaste={onPaste}
              onClick={(e) => {
                const t = e.target as HTMLElement;
                if (t.tagName === "IMG") openAlt(t as HTMLImageElement);
              }}
              className="blog-prose blog-editor min-h-[60vh] px-6 py-6 outline-none md:px-9"
            />
            <div className="flex justify-between rounded-b-2xl border-t border-espresso/10 px-5 py-2.5 text-xs font-semibold text-espresso/50">
              <span>{words} words</span>
              <span>Tip: click a picture to edit its description (alt text)</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) insertImage(f); }} />
        </div></div>


        {/* ---------- side panel with tabs ---------- */}
        <aside className="flex min-h-0 flex-col border-t border-espresso/10 bg-white/70 lg:border-l lg:border-t-0">
          <div role="tablist" className="flex shrink-0 gap-1 border-b border-espresso/10 px-3 pt-3">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-t-xl px-4 py-2.5 text-sm font-bold transition ${tab === t.id ? "bg-white text-espresso shadow-[0_-6px_18px_-12px_rgba(35,27,24,0.5)]" : "text-espresso/55 hover:text-espresso"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div data-lenis-prevent className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white p-5">
            {tab === "seo" && (
              <>

            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full font-hero text-2xl font-extrabold text-espresso ${ring}`}>{seo.score}</div>
              </div>
              <p className="text-sm text-espresso/70">{seo.score >= 80 ? "Great. This post is well optimised." : seo.score >= 60 ? "Good start. A few quick fixes below." : "Needs work. Follow the red items below."}</p>
            </div>
            <ul className="space-y-2">
              {seo.checks.map((c) => (
                <li key={c.id} className="flex gap-2.5 text-[13px] leading-snug">
                  <span aria-hidden className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${c.level === "good" ? "bg-emerald-500" : c.level === "warn" ? "bg-sun" : "bg-red-500"}`} />
                  <span className="text-espresso/85">{c.label}{c.tip && <span className="block text-espresso/50">{c.tip}</span>}</span>
                </li>
              ))}
            </ul>
          
                <hr className="border-espresso/10" />

            <div>
              <label className={lab} htmlFor="bl-kw">Focus keyword</label>
              <input id="bl-kw" className={inp} value={focusKeyword} onChange={(e) => { setFocusKeyword(e.target.value); touch(); }} placeholder="e.g. seo for small business" />
            </div>
            <div>
              <label className={lab} htmlFor="bl-mt">SEO title <span className={`ml-1 normal-case ${((metaTitle || title).length > 60) ? "text-red-700" : "text-espresso/40"}`}>{(metaTitle || title).length}/60</span></label>
              <input id="bl-mt" className={inp} value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); touch(); }} placeholder={title || "Defaults to the post title"} />
            </div>
            <div>
              <label className={lab} htmlFor="bl-md">Meta description <span className={`ml-1 normal-case ${((metaDescription || excerpt).length > 160) ? "text-red-700" : "text-espresso/40"}`}>{(metaDescription || excerpt).length}/160</span></label>
              <textarea id="bl-md" rows={3} className={area} value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); touch(); }} placeholder={excerpt || "Defaults to the summary"} />
            </div>
            <div className="rounded-xl border border-espresso/10 bg-ivory p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-espresso/45">How it looks on Google</p>
              <p className="mt-2 truncate text-xs text-emerald-800">{SITE_URL.replace(/^https?:\/\//, "")} › blogs › {slug}</p>
              <p className="mt-0.5 line-clamp-2 text-[17px] leading-snug text-[#1a0dab]">{shownTitle}</p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-espresso/70">{shownDesc}</p>
            </div>
            <div>
              <label className={lab} htmlFor="bl-og">Social share image (optional)</label>
              <input id="bl-og" className={inp} value={ogImage} onChange={(e) => { setOgImage(e.target.value); touch(); }} placeholder="Defaults to the cover image" />
            </div>
            <div>
              <label className={lab} htmlFor="bl-cn">Canonical address (optional)</label>
              <input id="bl-cn" className={inp} value={canonical} onChange={(e) => { setCanonical(e.target.value); touch(); }} placeholder={`${SITE_URL}/blogs/${slug}`} />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-espresso">
              <input type="checkbox" checked={noindex} onChange={(e) => { setNoindex(e.target.checked); touch(); }} className="h-4 w-4 accent-espresso" />
              Hide this post from Google (noindex)
            </label>
          
              </>
            )}
            {tab === "cover" && (
              <>

            {coverImage ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt={coverAlt} className="aspect-[16/10] w-full rounded-xl object-cover" />
                <div className="mt-3">
                  <label className={lab} htmlFor="bl-ca">Picture description (alt text)</label>
                  <input id="bl-ca" className={inp} value={coverAlt} onChange={(e) => { setCoverAlt(e.target.value); touch(); }} placeholder="Describe the picture in a few words" />
                </div>
                <button type="button" onClick={() => { setCoverImage(""); setCoverAlt(""); touch(); }} className="mt-3 text-sm font-semibold text-red-700/80 hover:text-red-700">Remove cover</button>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()} className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border-2 border-dashed border-espresso/20 text-sm font-semibold text-espresso/60 transition hover:border-flame hover:text-flame">
                {uploading ? "Uploading…" : "+ Upload cover image"}
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const u = await upload(f); if (u) { setCoverImage(u); touch(); } }} />
          
              </>
            )}
            {tab === "details" && (
              <>

            <div>
              <label className={lab} htmlFor="bl-ex">Summary (shown on the blog page)</label>
              <textarea id="bl-ex" rows={3} className={area} value={excerpt} onChange={(e) => { setExcerpt(e.target.value); touch(); }} placeholder="One or two sentences" />
            </div>
            <div>
              <label className={lab} htmlFor="bl-cat">Category</label>
              <input id="bl-cat" className={inp} value={category} onChange={(e) => { setCategory(e.target.value); touch(); }} placeholder="e.g. SEO" />
            </div>
            <div>
              <label className={lab} htmlFor="bl-tg">Tags (separate with commas)</label>
              <input id="bl-tg" className={inp} value={tagsText} onChange={(e) => { setTagsText(e.target.value); touch(); }} placeholder="seo, ai search, local business" />
            </div>
            <div>
              <label className={lab} htmlFor="bl-au">Author</label>
              <input id="bl-au" className={inp} value={author} onChange={(e) => { setAuthor(e.target.value); touch(); }} />
            </div>
            <div>
              <label className={lab} htmlFor="bl-dt">Publish date</label>
              <input id="bl-dt" type="datetime-local" className={inp} value={toLocal(publishedAt)} onChange={(e) => { setPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : ""); touch(); }} />
              <p className="mt-1.5 text-xs text-espresso/50">Leave empty to publish right now. Pick a future date to schedule it.</p>
            </div>
          
              </>
            )}
          </div>
        </aside>
      </div>

      {modal === "link" && (
        <Modal title="Add a link" onClose={() => setModal(null)}>
          <p className="text-sm text-espresso/60">Select some text first to turn it into a link. With nothing selected, the page name is inserted.</p>
          <input autoFocus className={`${inp} mt-4`} placeholder="Search your pages and posts" value={linkQ} onChange={(e) => setLinkQ(e.target.value)} />
          <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
            {filteredLinks.map((p) => (
              <li key={p.href}>
                <button type="button" onClick={() => applyLink(p.href, p.label)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sun/30">
                  <span className="font-semibold text-espresso">{p.label}</span>
                  <span className="text-xs text-espresso/45">{p.href}</span>
                </button>
              </li>
            ))}
            {filteredLinks.length === 0 && <li className="px-3 py-2 text-sm text-espresso/50">Nothing found.</li>}
          </ul>
          <div className="mt-5 border-t border-espresso/10 pt-4">
            <label className={lab} htmlFor="bl-lu">Or any web address</label>
            <div className="flex gap-2">
              <input id="bl-lu" className={inp} placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <button type="button" disabled={!/^(https?:\/\/|mailto:|tel:|\/)/i.test(linkUrl.trim())} onClick={() => applyLink(linkUrl.trim())} className="h-11 shrink-0 rounded-xl bg-espresso px-5 text-sm font-semibold text-ivory disabled:opacity-40">Add</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "alt" && (
        <Modal title="Describe this picture" onClose={() => setModal(null)}>
          <p className="text-sm text-espresso/60">A short description helps people using screen readers and helps Google understand the picture.</p>
          <input autoFocus className={`${inp} mt-4`} value={altVal} onChange={(e) => setAltVal(e.target.value)} placeholder="e.g. Team reviewing a Google Ads report" onKeyDown={(e) => { if (e.key === "Enter") { altTarget.current?.setAttribute("alt", altVal.trim()); sync(); setModal(null); } }} />
          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={() => { altTarget.current?.closest("p,figure")?.remove(); sync(); setModal(null); }} className="text-sm font-semibold text-red-700/80 hover:text-red-700">Remove picture</button>
            <button type="button" onClick={() => { altTarget.current?.setAttribute("alt", altVal.trim()); sync(); setModal(null); }} className="h-11 rounded-full bg-espresso px-7 text-sm font-semibold text-ivory">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );

  // Drawn straight onto the page body so it sits above the site menu and Sunny.
  return mounted ? createPortal(ui, document.body) : null;
}
