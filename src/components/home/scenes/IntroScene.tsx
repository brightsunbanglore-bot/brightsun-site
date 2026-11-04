"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { ScrubWords } from "@/components/animations/ScrubWords";
import { Reveal } from "@/components/animations/Reveal";
import { introduction } from "@/data/home";

/**
 * Scene 2 — introduction. As the hero scrolls away Sunny shrinks into the
 * companion and settles in this scene's right-hand gutter, waving hello.
 * The statement brightens word by word; soft golden discs drift at
 * different depths (parallax). No pinning.
 */
export function IntroScene() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-intro-disc]").forEach((el) => {
          const depth = Number(el.dataset.depth ?? 60);
          gsap.fromTo(
            el,
            { y: depth },
            {
              y: -depth,
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-sun-scene="intro"
      data-sun-cue="hello"
      aria-label="About Brightsun SEO"
      className="relative overflow-hidden bg-ivory"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div data-intro-disc data-depth="90" className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sun/20 blur-2xl" />
        <div data-intro-disc data-depth="40" className="absolute bottom-10 right-[18%] h-40 w-40 rounded-full bg-flame/15 blur-2xl" />
      </div>
      <Container className="relative grid gap-12 py-28 md:py-40 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-espresso">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-flame" />
            Who we are
          </p>
          <ScrubWords
            as="h2"
            text={introduction.statement}
            className="mt-6 font-hero text-[clamp(2.1rem,4.6vw,4.4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-espresso"
          />
          <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            {introduction.paragraphs.map((para, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <p className="text-lg leading-relaxed text-espresso/70">{para}</p>
              </Reveal>
            ))}
          </div>
        </div>
        {/* Sunny's spot for this scene (desktop gutter). */}
        <div aria-hidden className="relative hidden lg:col-span-4 lg:block">
          <span data-sun-spot="intro" className="absolute left-1/2 top-[38%] h-px w-px" />
        </div>
      </Container>
    </section>
  );
}
