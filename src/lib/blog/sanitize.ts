/**
 * Keeps only safe, simple HTML from the editor. Everything else is dropped.
 * (Only the signed-in admin can write posts, but we still never trust pasted HTML.)
 */
const TAGS = new Set(["p", "h2", "h3", "h4", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "br", "hr", "code", "pre", "table", "thead", "tbody", "tr", "th", "td"]);
const MAP: Record<string, string> = { b: "strong", i: "em", div: "p", h1: "h2", h5: "h4", h6: "h4", strike: "s", del: "s" };
const VOID = new Set(["br", "hr", "img"]);
const INLINE = new Set(["a", "strong", "em", "u", "s", "code", "img", "br"]);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function attrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) out[m[1].toLowerCase()] = unesc(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}

const safeUrl = (u: string, img = false) => {
  const v = u.trim();
  if (!v) return "";
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (!img && v.startsWith("#")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (!img && /^(mailto:|tel:)/i.test(v)) return v;
  return "";
};

export function sanitizeHtml(input: string): string {
  let html = String(input || "").replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1\s*>/gi, "");
  const parts = html.split(/(<[^>]*>)/g);
  const out: string[] = [];
  const stack: string[] = [];
  let implicit = false; // a <p> we opened ourselves around loose top-level text
  const closeImplicit = () => {
    if (implicit) {
      while (stack.length) out.push(`</${stack.pop()}>`);
      implicit = false;
    }
  };
  for (const part of parts) {
    if (!part) continue;
    if (!part.startsWith("<")) {
      if (!stack.length && part.trim()) {
        out.push("<p>");
        stack.push("p");
        implicit = true;
      }
      out.push(part.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }
    const m = /^<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*?)\/?\s*>$/.exec(part);
    if (!m) continue;
    let name = m[2].toLowerCase();
    name = MAP[name] || name;
    if (!TAGS.has(name)) continue;
    if (!m[1] && !stack.length && INLINE.has(name) && name !== "br") {
      out.push("<p>");
      stack.push("p");
      implicit = true;
    } else if (!m[1] && implicit && !INLINE.has(name)) {
      closeImplicit(); // a block element starts: end the loose paragraph first
    }
    if (m[1]) {
      if (implicit && name === "p") {
        closeImplicit();
        continue;
      }
      if (VOID.has(name)) continue;
      const i = stack.lastIndexOf(name);
      if (i === -1) continue;
      while (stack.length > i) out.push(`</${stack.pop()}>`);
      continue;
    }
    const a = attrs(m[3]);
    let tag = `<${name}`;
    if (name === "a") {
      const href = safeUrl(a.href || "");
      if (!href) continue;
      tag += ` href="${esc(href)}"`;
      if (/^https?:\/\//i.test(href) && !/brightsunseo\.com/i.test(href)) tag += ` target="_blank" rel="noopener noreferrer"`;
    } else if (name === "img") {
      const src = safeUrl(a.src || "", true);
      if (!src) continue;
      tag += ` src="${esc(src)}" alt="${esc((a.alt || "").slice(0, 300))}" loading="lazy"`;
    } else if ((name === "th" || name === "td") && /^\d+$/.test(a.colspan || "")) tag += ` colspan="${a.colspan}"`;
    out.push(tag + (VOID.has(name) ? " />" : ">"));
    if (!VOID.has(name)) stack.push(name);
  }
  while (stack.length) out.push(`</${stack.pop()}>`);
  html = out.join("");
  html = html.replace(/<p>\s*<\/p>/gi, "");
  // tidy: drop empty paragraphs the editor leaves behind
  html = html.replace(/<p>(\s|&nbsp;|<br\s*\/>)*<\/p>/gi, "");
  return html.trim();
}
