import Link from "next/link";
import type { Post } from "@/lib/blog/types";
import { formatDate, readingMinutes } from "@/lib/blog/text";

export function PostCard({ post, big = false }: { post: Post; big?: boolean }) {
  return (
    <article className={`group ${big ? "md:col-span-2 lg:col-span-3" : ""}`}>
      <Link href={`/blogs/${post.slug}`} className={`flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-34px_rgba(35,27,24,0.5)] ring-1 ring-espresso/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_-30px_rgba(255,138,29,0.5)] ${big ? "md:flex-row" : ""}`}>
        <div className={`relative overflow-hidden bg-cream ${big ? "aspect-[16/10] md:aspect-auto md:w-[55%]" : "aspect-[16/10]"}`}>
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt={post.coverAlt || ""} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div aria-hidden className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#ffc233,#ff8a1d)] font-hero text-6xl font-extrabold text-espresso/80">B</div>
          )}
        </div>
        <div className={`flex flex-1 flex-col p-6 md:p-8 ${big ? "md:justify-center" : ""}`}>
          {post.category && <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-flame">{post.category}</p>}
          <h3 className={`mt-2 font-hero font-extrabold leading-tight tracking-[-0.03em] text-espresso ${big ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}>{post.title}</h3>
          {post.excerpt && <p className={`mt-3 text-espresso/70 ${big ? "text-base md:text-lg" : "line-clamp-3 text-sm"}`}>{post.excerpt}</p>}
          <p className="mt-auto pt-5 text-xs font-semibold text-espresso/50">
            {formatDate(post.publishedAt)} · {readingMinutes(post.content)} min read
          </p>
        </div>
      </Link>
    </article>
  );
}
