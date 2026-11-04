import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PostCard } from "@/components/blog/PostCard";
import { getPublicBySlug, listPublic } from "@/lib/blog/store";
import { isAdmin } from "@/lib/blog/auth";
import { AdminBar } from "@/components/blog/AdminBar";
import { withHeadingIds } from "@/lib/blog/render";
import { SITE_URL, formatDate, readingMinutes } from "@/lib/blog/text";
import { siteConfig } from "@/data/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

const abs = (u: string) => (!u ? "" : u.startsWith("http") ? u : `${SITE_URL}${u}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublicBySlug((await params).slug);
  if (!p) return { title: "Post not found", robots: { index: false } };
  const title = p.seo.metaTitle || p.title;
  const description = p.seo.metaDescription || p.excerpt;
  const image = abs(p.seo.ogImage || p.coverImage);
  const url = p.seo.canonical || `${SITE_URL}/blogs/${p.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: p.seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: { type: "article", title, description, url, siteName: siteConfig.name, publishedTime: p.publishedAt, modifiedTime: p.updatedAt, authors: [p.author], tags: p.tags, images: image ? [{ url: image, alt: p.coverAlt || p.title }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const p = await getPublicBySlug((await params).slug);
  if (!p) notFound();
  const { html, toc } = withHeadingIds(p.content);
  const admin = await isAdmin();
  const related = (await listPublic()).filter((x) => x.id !== p.id).slice(0, 3);
  const url = p.seo.canonical || `${SITE_URL}/blogs/${p.slug}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.seo.metaTitle || p.title,
      description: p.seo.metaDescription || p.excerpt,
      image: abs(p.seo.ogImage || p.coverImage) || undefined,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
      author: { "@type": "Organization", name: p.author },
      publisher: { "@type": "Organization", name: siteConfig.name, url: SITE_URL },
      mainEntityOfPage: url,
      keywords: p.tags.join(", ") || undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
  const share = encodeURIComponent(url);
  return (
    <article className="bg-ivory pb-20 pt-32 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Container>
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-espresso/55">
            <Link href="/" className="hover:text-flame">Home</Link> <span aria-hidden>/</span> <Link href="/blogs" className="hover:text-flame">Blogs</Link>
          </nav>
          {p.category && <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.24em] text-flame">{p.category}</p>}
          <h1 className="mt-3 font-hero text-[clamp(2.2rem,5.4vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-espresso">{p.title}</h1>
          {p.excerpt && <p className="mt-5 text-lg text-espresso/70 md:text-xl">{p.excerpt}</p>}
          <p className="mt-6 text-sm font-semibold text-espresso/55">
            By {p.author} · <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time> · {readingMinutes(p.content)} min read
          </p>
        </div>

        {p.coverImage && (
          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-3xl bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.coverImage} alt={p.coverAlt || ""} className="h-auto w-full object-cover" />
          </div>
        )}

        <div className="mx-auto mt-12 max-w-3xl">
          {toc.filter((t) => t.level === 2).length >= 3 && (
            <nav aria-label="In this post" className="mb-10 rounded-2xl bg-cream p-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-espresso/60">In this post</p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.95rem] font-semibold text-espresso">
                {toc.filter((t) => t.level === 2).map((t) => (
                  <li key={t.id}><a href={`#${t.id}`} className="underline decoration-sun decoration-2 underline-offset-4 hover:text-flame">{t.text}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />

          {p.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <li key={t} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-espresso/70">#{t}</li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-espresso/10 pt-6 text-sm font-semibold text-espresso">
            Share:
            <a className="underline decoration-sun decoration-2 underline-offset-4 hover:text-flame" href={`https://wa.me/?text=${encodeURIComponent(p.title)}%20${share}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a className="underline decoration-sun decoration-2 underline-offset-4 hover:text-flame" href={`https://www.linkedin.com/sharing/share-offsite/?url=${share}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a className="underline decoration-sun decoration-2 underline-offset-4 hover:text-flame" href={`https://twitter.com/intent/tweet?url=${share}&text=${encodeURIComponent(p.title)}`} target="_blank" rel="noopener noreferrer">X</a>
          </div>

          <div className="mt-12 rounded-3xl bg-espresso p-8 text-center text-ivory md:p-10">
            <p className="font-hero text-2xl font-extrabold md:text-3xl">Want this kind of growth for your business?</p>
            <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-sun px-7 py-3.5 text-sm font-bold text-espresso transition hover:-translate-y-0.5">Let&apos;s talk <span aria-hidden>→</span></Link>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mx-auto mt-20 max-w-6xl">
            <h2 className="font-hero text-2xl font-extrabold text-espresso md:text-3xl">Keep reading</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((r) => <PostCard key={r.id} post={r} />)}
            </div>
          </div>
        )}
      </Container>
      {admin && <AdminBar editId={p.id} />}
    </article>
  );
}
