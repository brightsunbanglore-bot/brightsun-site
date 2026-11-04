"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { mascotState } from "@/components/mascot/mascotState";
import { hero } from "@/data/home";
import { HeroChips, HeroDoodles, HeroHill } from "./HeroAccents";

/**
 * Homepage hero (approved direction): editorial headline + CTAs on the
 * left, the living 3D sun on the right (rendered by the persistent
 * SunnyCompanion dock over the `[data-sun-slot]` placeholder).
 *
 * Entrance: words rise through masks, supporting copy and CTAs follow,
 * the sun walks in (handled in the character), accents drift in.
 * Scroll: copy and accents shift at different depths while the sun leans
 * and waves — no pinning or scroll-jacking.
 */
export function HeroSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();

      // Scroll progress for the mascot reaction (all devices; the character ignores it under reduced motion).
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          mascotState.scroll = self.progress;
        },
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ delay: 0.1, defaults: { ease: "expo.out" } })
          // y: 0 clears the CSS pre-hydration offset, which GSAP reads as px.
          .fromTo("[data-hero-word]", { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.3, stagger: 0.07 })
          .fromTo("[data-hero-fade]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.5)
          .fromTo(
            "[data-hero-float]",
            { autoAlpha: 0, y: 24, scale: 0.92 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.12, ease: "back.out(1.7)" },
            1.6,
          );

        // Scroll scene: layers move at different rates.
        const scrub = { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 };
        gsap.to("[data-hero-copy]", { y: -90, autoAlpha: 0.35, ease: "none", scrollTrigger: scrub });
        gsap.utils.toArray<HTMLElement>("[data-hero-float]").forEach((el) => {
          const depth = Number(el.dataset.depth ?? 20);
          gsap.to(el, { y: -depth * 4, ease: "none", scrollTrigger: scrub });
        });
        gsap.to("[data-hero-stage]", { y: 60, ease: "none", scrollTrigger: scrub });
      });

      // Pointer parallax on accents (desktop, fine pointer).
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const movers = gsap.utils.toArray<HTMLElement>("[data-hero-float]").map((el) => {
          const depth = Number(el.dataset.depth ?? 20);
          return {
            depth,
            x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
            r: gsap.quickTo(el, "rotation", { duration: 1.2, ease: "power3.out" }),
          };
        });
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          movers.forEach((m) => {
            m.x(nx * m.depth);
            m.r(nx * m.depth * 0.08);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => {
        st.kill();
        mm.revert();
        mascotState.scroll = 0;
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} data-sun-scene="hero" aria-labelledby="hero-title" className="relative z-0 overflow-hidden bg-ivory">
      <HeroHill />
      <Container className="relative grid min-h-svh items-center gap-6 pb-12 pt-28 md:pt-32 lg:grid-cols-12 lg:gap-6 lg:pb-16">
        {/* Copy */}
        <div data-hero-copy className="relative z-10 lg:col-span-6 xl:col-span-6">
          <p
            data-hero-fade
            className="inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-espresso shadow-[0_6px_20px_-12px_rgba(35,27,24,0.3)]"
          >
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-flame" />
            {hero.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="mt-7 font-hero text-[clamp(3rem,7.4vw,7.2rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-espresso"
          >
            {hero.titleLines.map((words, li) => (
              <span key={li} className={`block ${li === hero.accentLine ? "text-sun" : ""}`}>
                {words.map((w, wi) => (
                  <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <span data-hero-word className="inline-block">
                      {w}
                      {wi < words.length - 1 ? " " : ""}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p data-hero-fade className="mt-7 max-w-md text-lg leading-relaxed text-espresso/70 md:text-xl">
            {hero.intro}
          </p>

          <div data-hero-fade className="mt-9 flex flex-wrap items-center gap-4">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>

        {/* Mascot */}
        <div data-hero-stage className="relative lg:col-span-6 xl:col-span-6">
          <div className="relative mx-auto w-full max-w-[380px] sm:max-w-[460px] lg:max-w-[620px]">
            <HeroDoodles />
            <HeroChips />
            {/* Sunny's hero slot: the persistent companion dock (SunnyCompanion) sits exactly here. */}
            <div data-sun-slot aria-hidden className="aspect-[10/11] w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
