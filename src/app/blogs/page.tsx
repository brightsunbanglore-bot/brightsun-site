import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PostCard } from "@/components/blog/PostCard";
import { listPublic } from "@/lib/blog/store";
import { isAdmin } from "@/lib/blog/auth";
import { AdminBar } from "@/components/blog/AdminBar";
import Link from "next/link";
import { SITE_URL } from "@/lib/blog/text";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Practical SEO, AI search, Google Ads and growth ideas from the BrightSun team.",
  alternates: { canonical: `${SITE_URL}/blogs`, types: { "application/rss+xml": `${SITE_URL}/blogs/feed.xml` } },
};

export default async function BlogsPage() {
  const posts = await listPublic();
  const admin = await isAdmin();
  const [first, ...rest] = posts;
  return (
    <>
      <section className="relative flex min-h-[62svh] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_120%,#5a2c12_0%,#1a110e_50%,#0e0908_100%)] text-ivory">
        <span aria-hidden className="pointer-events-none absolute bottom-[-40%] left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,138,29,.45),transparent_62%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-10 pt-32 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.34em] text-sun">The BrightSun blog</p>
          <h1 className="mt-6 font-hero text-[clamp(2.6rem,7.5vw,6.6rem)] font-extrabold leading-[0.96] tracking-[-0.05em]">Ideas to help you grow brighter.</h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-ivory/70 md:text-lg">SEO, AI search, ads and honest marketing advice from the people who do the work.</p>
        </div>
      </section>

      <section className="bg-ivory py-16 md:py-24">
        <Container>
          {posts.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-3xl bg-cream p-10 text-center">
              <p className="font-hero text-2xl font-extrabold text-espresso">Our first posts are on the way.</p>
              <p className="mt-3 text-espresso/70">Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              <PostCard post={first} big />
              {rest.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </Container>
      </section>
      {admin ? <AdminBar /> : (
        <p className="bg-ivory pb-10 text-center text-xs text-espresso/35">
          <Link href="/admin/blogs" className="hover:text-flame">Admin</Link>
        </p>
      )}
    </>
  );
}
