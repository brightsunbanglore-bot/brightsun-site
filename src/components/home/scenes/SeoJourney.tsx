"use client";

import { warpT } from "@/components/mascot/journeyTiming";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";
import { cueSunny } from "@/components/mascot/mascotState";
import { sceneClipTime } from "@/components/mascot/sunnyAudio";
import { introduction, seoStory } from "@/data/home";

const KEYWORD = "wedding photographer near me";

/**
 * While Sunny's journey voice plays, the card follows what he says: [seconds into the recording, timeline position].
 * (Scrolling still drives it when the voice is not playing.)
 */
const VOICE_MAP_OLD: [number, number][] = [
  [4.0, 0], [7.7, 0.14], [12.3, 0.235], [18.5, 0.235], [18.9, 0.26], // search typed, results appear, "Step one… Discover"
  [24.6, 0.31], [25.0, 0.33], [31.0, 0.5], [32.4, 0.6], // "Step two… Optimise", checks tick, "ooooh"
  [33.1, 0.615], [33.4, 0.63], [35.0, 0.64], [38.5, 0.9], [41.5, 0.94], [52.0, 1.02], // "step three… Grow", the climb, the line
];
// times were authored on the first recording; map them onto the current one
const VOICE_MAP: [number, number][] = VOICE_MAP_OLD.map(([t, p]) => [warpT(t), p]);
function voicePos(t: number) {
  if (t <= VOICE_MAP[0][0]) return 0;
  for (let i = 1; i < VOICE_MAP.length; i++) {
    const [t1, p1] = VOICE_MAP[i];
    const [t0, p0] = VOICE_MAP[i - 1];
    if (t <= t1) return p0 + ((t - t0) / (t1 - t0)) * (p1 - p0);
  }
  return VOICE_MAP[VOICE_MAP.length - 1][1];
}

const STEPS = [
  { title: "Discover", text: "We research the searches your customers actually make." },
  { title: "Optimise", text: "We tune your pages, structure and links around those searches." },
  { title: "Grow", text: "Your brand climbs towards the top of the results." },
];

/**
 * Scene 4 — the SEO journey, told on a stylised search-results card
 * (illustrative: no real results, positions or numbers).
 *
 * Desktop: the section pins briefly and one scrubbed timeline plays
 * 1) keyword discovery (the query types itself, results appear),
 * 2) optimisation (the approach checklist ticks off),
 * 3) growth (your brand's result climbs to the top, the trend line draws).
 * Sunny stands beside the card and, when the climb starts, lifts its
 * sunglasses to examine it. The DOM holds the final state, so mobile,
 * reduced motion and no-JS visitors simply see the finished story.
 */
export function SeoJourney() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();

      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-seo-card], [data-seo-step]", {
          y: 40,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        });
      });

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-seo-row]");
        const brand = section.querySelector<HTMLElement>("[data-seo-brand]");
        const path = section.querySelector<SVGPathElement>("[data-seo-trend]");
        const pinEl = section.querySelector<HTMLElement>("[data-seo-pin]");
        if (!brand || !path || !pinEl || rows.length < 2) return;
        const others = rows.filter((r) => r !== brand);
        const step = () => rows[1].offsetTop - rows[0].offsetTop;
        const len = path.getTotalLength();
        let examined = false;
        gsap.set("[data-seo-step]", { opacity: 0.35 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pinEl,
            start: "top top",
            end: "+=180%",
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onLeaveBack: () => {
              examined = false;
            },
          },
        });
        tl
          // 1 — discover
          .to("[data-seo-step='0']", { opacity: 1, duration: 0.05 }, 0.24)
          .fromTo("[data-seo-query]", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.22 }, 0)
          .from(rows, { autoAlpha: 0, x: -24, stagger: 0.03, duration: 0.1 }, 0.14)
          // brand starts at the bottom of the list
          .fromTo(brand, { y: () => step() * others.length }, { y: () => step() * others.length, duration: 0.01 }, 0)
          .fromTo(others, { y: () => -step() }, { y: () => -step(), duration: 0.01 }, 0)
          // 2 — optimise
          .to("[data-seo-step='0']", { opacity: 0.35, duration: 0.05 }, 0.32)
          .to("[data-seo-step='1']", { opacity: 1, duration: 0.05 }, 0.32)
          .from("[data-seo-check]", { scale: 0, autoAlpha: 0, stagger: 0.05, duration: 0.06, ease: "back.out(3)" }, 0.34)
          .from("[data-seo-chip]", { backgroundColor: "rgba(255,255,255,1)", stagger: 0.05, duration: 0.06 }, 0.34)
          .fromTo(brand, { boxShadow: "0 0 0 0 rgba(255,194,51,0)" }, { boxShadow: "0 0 0 3px rgba(255,194,51,1)", duration: 0.1 }, 0.5)
          // 3 — grow
          .to("[data-seo-step='1']", { opacity: 0.35, duration: 0.05 }, 0.62)
          .to("[data-seo-step='2']", { opacity: 1, duration: 0.05 }, 0.62)
          .call(
            () => {
              if (!examined) {
                examined = true;
                cueSunny("examine");
              }
            },
            [],
            0.63,
          )
          .to(brand, { y: 0, duration: 0.26, ease: "power2.inOut" }, 0.64)
          .to(others, { y: 0, duration: 0.26, ease: "power2.inOut" }, 0.64)
          .fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.3 }, 0.64)
          .to({}, { duration: 0.08 });

        // the voice leads: while it plays, the card, steps and chart follow Sunny's words
        const follow = () => {
          const t = sceneClipTime("journey");
          if (t >= 0) tl.time(Math.min(voicePos(t), tl.duration()), false);
        };
        gsap.ticker.add(follow);
        return () => gsap.ticker.remove(follow);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} data-sun-scene="journey" data-sun-cue="journey" aria-labelledby="journey-title" className="relative bg-ivory">
      <div data-seo-pin className="flex min-h-svh items-center py-24 lg:py-10">
        <Container className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-espresso">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-flame" />
              {seoStory.eyebrow}
            </p>
            <MaskedLines
              as="h2"
              id="journey-title"
              className="mt-5 font-hero text-[clamp(2.4rem,4.4vw,4.2rem)] font-extrabold leading-[1] tracking-[-0.04em] text-espresso"
            >
              {seoStory.titleLines[0]} <span className="text-flame">{seoStory.titleLines[1]}</span>
            </MaskedLines>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso/70">{seoStory.body}</p>
            <ol className="mt-10 space-y-5" aria-label="The SEO journey">
              {STEPS.map((s, i) => (
                <li key={s.title} data-seo-step={i} className="flex gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun text-sm font-bold text-espresso">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-hero text-xl font-bold text-espresso">{s.title}</span>
                    <span className="mt-1 block text-espresso/65">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative lg:col-span-7">
            <figure
              data-seo-card
              className="relative mx-auto w-full max-w-[600px] rounded-[32px] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(35,27,24,0.45)] md:p-8"
              aria-label="Illustration: a brand climbing search results"
            >
              {/* Sunny stands just off the card's left edge while it examines the ranking. */}
              <span data-sun-spot="journey" aria-hidden className="absolute -left-16 top-[52%] hidden h-px w-px lg:block" />
              <div className="flex items-center gap-3 rounded-full border border-espresso/10 bg-ivory px-4 py-3">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-flame" aria-hidden>
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" fill="none" />
                  <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                <span data-seo-query className="truncate text-sm font-medium text-espresso/75">
                  {KEYWORD}
                </span>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[1fr_170px]">
                <ul className="space-y-3" aria-hidden>
                  {/* Final order in the DOM (brand first); desktop animates the climb. */}
                  {[0, 1, 2, 3].map((i) =>
                    i === 0 ? (
                      <li
                        key={i}
                        data-seo-row
                        data-seo-brand
                        className="relative z-10 flex items-center gap-3 rounded-2xl bg-cream p-3.5 ring-2 ring-sun"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun text-base">☀</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-espresso">Your brand</span>
                          <span className="mt-1.5 block h-2 w-4/5 rounded-full bg-flame/40" />
                        </span>
                      </li>
                    ) : (
                      <li key={i} data-seo-row className="flex items-center gap-3 rounded-2xl bg-ivory p-3.5">
                        <span className="h-9 w-9 shrink-0 rounded-full bg-espresso/10" />
                        <span className="min-w-0 flex-1">
                          <span className="block h-2.5 w-2/5 rounded-full bg-espresso/15" />
                          <span className="mt-2 block h-2 w-4/5 rounded-full bg-espresso/10" />
                        </span>
                      </li>
                    ),
                  )}
                </ul>

                <div className="flex flex-col gap-4">
                  <ul className="flex flex-wrap gap-2 md:flex-col" aria-label="Optimisation checklist">
                    {introduction.approach.map((a) => (
                      <li
                        key={a}
                        data-seo-chip
                        className="inline-flex items-center gap-2 rounded-full bg-sun/30 px-3 py-1.5 text-xs font-semibold text-espresso"
                      >
                        <span data-seo-check aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-flame text-[10px] text-white">
                          ✓
                        </span>
                        {a}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-2xl bg-ivory p-3">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-espresso/55">Visibility</span>
                    <svg viewBox="0 0 140 60" className="mt-1 h-14 w-full" aria-hidden>
                      <path
                        data-seo-trend
                        d="M4 54 C 26 52, 34 44, 50 42 S 78 34, 92 26 S 120 10, 136 6"
                        fill="none"
                        stroke="#FF8A1D"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <figcaption className="mt-4 text-xs text-espresso/45">Illustrative example — not real search data.</figcaption>
            </figure>
          </div>
        </Container>
      </div>
    </section>
  );
}
