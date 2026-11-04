"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";
import { Button } from "@/components/ui/Button";
import { introduction, seoStory, services } from "@/data/home";

/** Illustrative search card (no real results, rankings or numbers shown). */
function SearchVisual() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px]">
      <div data-seo-disc className="absolute inset-[6%] rounded-full bg-sun" />
      <div
        data-seo-card
        className="absolute inset-x-[8%] top-[18%] rounded-[28px] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(35,27,24,0.45)] md:p-7"
      >
        <div className="flex items-center gap-3 rounded-full border border-espresso/10 bg-ivory px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-flame" aria-hidden>
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" fill="none" />
            <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium text-espresso/70">best yoga studio near me</span>
        </div>
        <ul className="mt-5 space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              data-seo-row
              className={`rounded-2xl p-4 ${i === 0 ? "bg-cream ring-2 ring-sun" : "bg-ivory"}`}
            >
              <span className={`block h-2.5 w-2/5 rounded-full ${i === 0 ? "bg-flame" : "bg-espresso/15"}`} />
              <span className="mt-3 block h-2 w-11/12 rounded-full bg-espresso/10" />
              <span className="mt-2 block h-2 w-3/4 rounded-full bg-espresso/10" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Scene 2 — the SEO services story. Revealed from the hero through layered
 * clipping: the cream panel opens from a rounded inset, the yellow disc
 * irises open, then the search card and rows rise in. Scrubbed, no pinning.
 */
export function SeoStory() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = root.current;
        gsap.fromTo(
          "[data-seo-panel]",
          { clipPath: "inset(14% 6% 0% 6% round 56px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 56px)",
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "top 20%", scrub: 0.6 },
          },
        );
        gsap.fromTo(
          "[data-seo-disc]",
          { clipPath: "circle(0% at 50% 60%)" },
          {
            clipPath: "circle(70% at 50% 50%)",
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 75%", end: "top 15%", scrub: 0.6 },
          },
        );
        gsap.fromTo(
          "[data-seo-card]",
          { yPercent: 18, rotate: -3, autoAlpha: 0 },
          {
            yPercent: 0,
            rotate: 0,
            autoAlpha: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 65%", end: "top 15%", scrub: 0.6 },
          },
        );
        gsap.from("[data-seo-row]", {
          x: -24,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-seo-card]", start: "top 70%", once: true },
        });
        gsap.from("[data-service-card]", {
          y: 50,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-service-grid]", start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="services" aria-labelledby="seo-title" className="relative z-10 -mt-10 bg-ivory md:-mt-16">
      <div data-seo-panel className="rounded-t-[56px] bg-cream">
        <Container className="pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SearchVisual />
            </div>
            <div className="lg:col-span-6">
              <p className="inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-espresso">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-flame" />
                {seoStory.eyebrow}
              </p>
              <MaskedLines
                as="h2"
                id="seo-title"
                className="mt-5 font-hero text-[clamp(2.4rem,4.6vw,4.4rem)] font-extrabold leading-[1] tracking-[-0.04em] text-espresso"
              >
                {seoStory.titleLines[0]} <span className="text-flame">{seoStory.titleLines[1]}</span>
              </MaskedLines>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso/70">{seoStory.body}</p>

              <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Our process">
                {introduction.approach.map((step, i) => (
                  <li key={step} className="rounded-2xl bg-white px-4 py-4 shadow-[0_10px_24px_-18px_rgba(35,27,24,0.4)]">
                    <span className="text-xs font-bold text-flame">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-1 block text-[0.95rem] font-semibold leading-tight text-espresso">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-9">
                <Button href="/services" variant="secondary">
                  Explore all services
                </Button>
              </div>
            </div>
          </div>

          <div data-service-grid className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {services.map((s, i) => (
              <Link
                key={s.title}
                href="/services"
                data-service-card
                className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-white p-7 shadow-[0_16px_40px_-28px_rgba(35,27,24,0.5)] transition-transform duration-500 ease-[cubic-bezier(.19,1,.22,1)] hover:-translate-y-1.5 md:p-8"
              >
                <span
                  aria-hidden
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sun/25 transition-transform duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-[1.8]"
                />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sun font-hero text-lg font-extrabold text-espresso">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative mt-8 block">
                  <span className="block font-hero text-[1.5rem] font-bold leading-tight text-espresso">{s.title}</span>
                  <span className="mt-3 block text-[0.98rem] leading-relaxed text-espresso/65">{s.description}</span>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-flame">
                    Learn more
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
