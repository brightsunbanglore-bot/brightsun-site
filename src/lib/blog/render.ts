import { slugify, stripTags } from "./text";

/** Gives every H2/H3 an id (for the contents list and shareable section links). */
export function withHeadingIds(html: string): { html: string; toc: { id: string; text: string; level: number }[] } {
  const toc: { id: string; text: string; level: number }[] = [];
  const used = new Set<string>();
  const out = html.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/gi, (_, tag: string, inner: string) => {
    const text = stripTags(inner);
    let id = slugify(text) || "section";
    let n = 2;
    while (used.has(id)) id = `${slugify(text) || "section"}-${n++}`;
    used.add(id);
    toc.push({ id, text, level: tag.toLowerCase() === "h2" ? 2 : 3 });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
  return { html: out, toc };
}
