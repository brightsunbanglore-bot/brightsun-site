"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";
import { Button } from "@/components/ui/Button";
import { cueSunny } from "@/components/mascot/mascotState";
import { homeServices as services } from "@/data/home";

/**
 * Scene 3 — services. On desktop the section pins and the service cards
 * travel horizontally with the scroll (one pin, scrubbed). The card nearest
 * the reading line becomes "active": it lifts, and Sunny hops over to it
 * and reacts. On tablet / mobile / reduced motion it is a plain grid that
 * also scrolls horizontally by hand on desktop if JS is off.
 */
export function ServicesScene() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-svc-card]");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(cards, {
          y: 60,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-svc-track]", start: "top 85%", once: true },
        });
      });

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const viewport = section.querySelector<HTMLElement>("[data-svc-viewport]");
        const track = section.querySelector<HTMLElement>("[data-svc-track]");
        const pinEl = section.querySelector<HTMLElement>("[data-svc-pin]");
        if (!viewport || !track || !pinEl) return;
        gsap.set(viewport, { overflowX: "hidden" });

        let active = -1;
        let lastCue = 0;
        const setActive = (i: number) => {
          if (i === active) return;
          const first = active === -1;
          active = i;
          cards.forEach((c, j) => {
            c.toggleAttribute("data-active", j === i);
            const spot = c.querySelector<HTMLElement>("[data-svc-spot]");
            if (spot) {
              if (j === i) spot.setAttribute("data-sun-spot", "services");
              else spot.removeAttribute("data-sun-spot");
            }
          });
          const now = performance.now();
          if (!first && now - lastCue > 1400) {
            lastCue = now;
            cueSunny("nod");
          }
        };
        setActive(0);

        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pinEl,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setActive(Math.round(self.progress * (cards.length - 1))),
          },
        });
        return () => cards.forEach((c) => c.removeAttribute("data-active"));
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="services"
      data-sun-scene="services"
      data-sun-cue="menu"
      aria-labelledby="services-title"
      className="relative z-10 -mt-10 rounded-t-[56px] bg-cream md:-mt-16"
    >
      <div data-svc-pin className="flex min-h-svh flex-col justify-center py-24 lg:py-16">
        <Container className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-espresso">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-flame" />
              What we do
            </p>
            <MaskedLines
              as="h2"
              id="services-title"
              className="mt-5 font-hero text-[clamp(2.4rem,4.4vw,4.2rem)] font-extrabold leading-[1] tracking-[-0.04em] text-espresso"
            >
              Services that help your brand <span className="text-flame">shine</span>
            </MaskedLines>
          </div>
          <div className="shrink-0">
            <Button href="/services" variant="secondary">
              Explore all services
            </Button>
          </div>
        </Container>

        <div data-svc-viewport className="mt-14 lg:mt-20 lg:overflow-x-auto">
          <ol
            data-svc-track
            className="mx-auto grid max-w-[1440px] gap-4 px-5 sm:grid-cols-2 md:px-10 lg:mx-0 lg:flex lg:w-max lg:max-w-none lg:gap-6 lg:px-14 lg:pr-[40vw] lg:pt-16"
          >
            {services.map((s, i) => (
              <li key={s.title} data-svc-card className="group relative lg:w-[400px] lg:shrink-0">
                {/* Sunny's perch above the active card (desktop). */}
                <span
                  data-svc-spot
                  {...(i === 0 ? { "data-sun-spot": "services" } : {})}
                  aria-hidden
                  className="pointer-events-none absolute right-16 top-[-48px] h-px w-px"
                />
                <Link
                  href="/services"
                  className="relative flex h-full min-h-[300px] flex-col justify-between overflow-hidden rounded-[28px] bg-white p-7 shadow-[0_16px_40px_-28px_rgba(35,27,24,0.5)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.19,1,.22,1)] hover:-translate-y-1.5 group-data-[active]:-translate-y-2 group-data-[active]:shadow-[0_30px_60px_-30px_rgba(255,138,29,0.55)] md:p-8"
                >
                  <span
                    aria-hidden
                    className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sun/25 transition-transform duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-[1.8] group-data-[active]:scale-[1.8]"
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
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
