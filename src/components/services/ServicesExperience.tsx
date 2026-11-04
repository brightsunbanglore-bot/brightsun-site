"use client";

import { useRef, type PointerEvent as RPointerEvent } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/sections/ContactForm";
import { SunnyCompanion } from "@/components/mascot/SunnyCompanion";
import { processSteps, serviceChapters, servicesHero } from "@/data/services";
import { SVC_CSS, SvcVisual } from "./ServiceVisuals";

const PAGE_CSS = `
@keyframes svc-rays{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes svc-shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes svc-mote{0%{transform:translateY(0) translateX(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-60vh) translateX(var(--dx));opacity:0}}
@keyframes svc-orbit{to{transform:rotate(360deg)}}
@keyframes svc-counter{to{transform:rotate(-360deg)}}
@keyframes svc-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-0.12em)}}
@keyframes svc-marquee{to{transform:translateX(-50%)}}
.svc-shimmer{background:linear-gradient(90deg,#FF8A1D,#FFC233,#FF8A1D,#FFC233);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:svc-shimmer 4s linear infinite}
.svc-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.55;animation:svc-drift 20s ease-in-out infinite alternate}
@keyframes svc-drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(6vw,4vw) scale(1.15)}100%{transform:translate(-4vw,6vw) scale(.95)}}
.svc-grain{opacity:.06;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.svc-sheen::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.9) 50%,transparent 70%);transform:translateX(-120%);animation:svc-sheen 3.6s ease-in-out infinite}
@keyframes svc-sheen{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
.svc-ring{position:absolute;left:0;top:0;--r:min(620px,48vw)}
@keyframes svc-spin{to{transform:rotateY(-360deg)}}
[data-svc-ringwrap]:hover .svc-ring{animation-play-state:paused}
.svc-ringcard{position:absolute;left:0;top:0;width:260px;padding:20px 20px 16px;border-radius:26px;background:linear-gradient(155deg,#FFFFFF,#FFF3DC);box-shadow:0 36px 60px -34px rgba(35,27,24,.45),0 0 0 1px rgba(255,194,51,.35);contain:layout style;backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:transform;transform-style:flat}
.svc-ringcard::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(120% 70% at 20% 0%,rgba(255,194,51,.2),transparent 70%);opacity:0;transition:opacity .4s;pointer-events:none}
.svc-rc-title{transition:color .4s}.svc-rc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid rgba(35,27,24,.08);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(35,27,24,.45);transition:color .4s,border-color .4s}
.svc-rc-foot i{display:inline-flex;height:24px;width:24px;align-items:center;justify-content:center;border-radius:999px;background:rgba(35,27,24,.07);font-style:normal;font-size:13px;transition:background .4s,color .4s,transform .4s}
.svc-ringcard{--k:0}
.svc-ringcard::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(155deg,#2E2420,#1A1311);opacity:var(--k);pointer-events:none}.svc-ringcard>*{position:relative}
.svc-ringcard::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(120% 70% at 20% 0%,rgba(255,194,51,.2),transparent 70%);opacity:var(--k);pointer-events:none}
.svc-rc-title{color:color-mix(in srgb,#FFF8EA calc(var(--k)*100%),#231B18)}
.svc-rc-grp{color:color-mix(in srgb,rgba(255,248,234,.6) calc(var(--k)*100%),rgba(35,27,24,.45))}
.svc-rc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid color-mix(in srgb,rgba(255,248,234,.16) calc(var(--k)*100%),rgba(35,27,24,.08));font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,#FFC233 calc(var(--k)*100%),rgba(35,27,24,.45))}
.svc-rc-foot i{display:inline-flex;height:24px;width:24px;align-items:center;justify-content:center;border-radius:999px;font-style:normal;font-size:13px;background:color-mix(in srgb,#FFC233 calc(var(--k)*100%),rgba(35,27,24,.07));color:color-mix(in srgb,#231B18 calc(var(--k)*100%),#231B18)}
.svc-ringcard:hover{box-shadow:0 40px 70px -30px rgba(255,138,29,.6),inset 0 1px 0 #fff}
.svc-outline{-webkit-text-stroke:2px rgba(35,27,24,.09);color:transparent}
.svc-rays{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,194,51,.28) 0deg 7deg,rgba(255,194,51,0) 7deg 20deg);-webkit-mask-image:radial-gradient(circle,#000 0%,transparent 62%);mask-image:radial-gradient(circle,#000 0%,transparent 62%);animation:svc-rays 60s linear infinite}
@media (prefers-reduced-motion: reduce){.svc-blob,.svc-ring,.svc-sheen::after,.svc-shimmer,.svc-rays,[data-svc-mote],[data-svc-orbit],[data-svc-orbit] > *,.svc-wave-ch,[data-svc-marquee]{animation:none!important}}
`;

const HERO_ORBIT = ["AI SEO", "AEO", "GEO", "SEO", "Local", "Technical", "Google Ads", "Meta Ads", "Email", "CRO"];

/**
 * Services page: a cinematic, scroll-driven tour of all ten services.
 * Silent Sunny (no voice on this page) travels alongside and acts out each service.
 */
export function ServicesExperience() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      let ringCleanup = () => {};
      // Ring: GSAP-ticker driven spin. It eases down as a card reaches the front, that card
      // zooms and fades to dark (only one at a time); the rest shrink back to light.
      {
        const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-svc-rc]"));
        const wrap = el.querySelector<HTMLElement>("[data-svc-ringwrap]");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const speed = { v: 1 };
        let rot = 0;
        const kSm = cards.map(() => 0);
        const enter = () => gsap.to(speed, { v: 0, duration: 0.9, ease: "power2.out", overwrite: true });
        const leave = () => gsap.to(speed, { v: 1, duration: 1.2, ease: "power2.inOut", overwrite: true });
        wrap?.addEventListener("mouseenter", enter);
        wrap?.addEventListener("mouseleave", leave);
        const ease = (t: number) => t * t * (3 - 2 * t);
        const tick = (_t: number, deltaMs: number) => {
          const dt = Math.min(0.05, deltaMs / 1000);
          let minDiff = 180;
          const diffs = cards.map((_, i) => {
            const d = Math.abs((((i * 36 + rot + 180) % 360) + 360) % 360 - 180);
            if (d < minDiff) minDiff = d;
            return d;
          });
          // glide slower while a card is settling at the front
          const dwell = 0.65 + 0.35 * ease(Math.min(1, minDiff / 14));
          if (!reduce) rot -= dt * 15 * speed.v * dwell;
          const lerp = 1 - Math.pow(0.0005, dt); // frame-rate independent smoothing
          cards.forEach((c, i) => {
            const target = ease(Math.max(0, 1 - diffs[i] / 15));
            kSm[i] += (target - kSm[i]) * lerp;
            const k = kSm[i];
            c.style.transform = `translate(-50%,-50%) rotateY(${(i * 36 + rot).toFixed(3)}deg) translateZ(calc(var(--r) + ${(k * 70).toFixed(1)}px)) scale(${(1 + k * 0.38).toFixed(4)})`;
            c.style.setProperty("--k", k.toFixed(4));
            c.style.opacity = (0.6 + 0.4 * Math.max(k, Math.max(0, 1 - diffs[i] / 110))).toFixed(3);
          });
        };
        gsap.ticker.add(tick);
        ringCleanup = () => {
          gsap.ticker.remove(tick);
          gsap.killTweensOf(speed);
          wrap?.removeEventListener("mouseenter", enter);
          wrap?.removeEventListener("mouseleave", leave);
        };
      }

      // Cursor-following glow in the hero.
      const hero = el.querySelector<HTMLElement>("[data-svc-hero]");
      const onMove = (e: PointerEvent) => {
        if (!hero) return;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        hero.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        hero.style.setProperty("--tilt", `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`);
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      // Chapters: loops run only while on screen; side-nav dot follows.
      const chapters = gsap.utils.toArray<HTMLElement>("[data-svc-chapter]");
      const dots = gsap.utils.toArray<HTMLElement>("[data-svc-dot]");
      const nav = el.querySelector<HTMLElement>("[data-svc-nav]");
      chapters.forEach((ch, i) => {
        ScrollTrigger.create({
          trigger: ch,
          start: "top 75%",
          end: "bottom 25%",
          onToggle: (self) => {
            ch.toggleAttribute("data-live", self.isActive);
            if (self.isActive) dots.forEach((d, j) => d.toggleAttribute("data-on", j === i));
          },
        });
      });
      const chaptersWrap = el.querySelector<HTMLElement>("[data-svc-chapters]");
      if (chaptersWrap && nav) {
        ScrollTrigger.create({
          trigger: chaptersWrap,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => gsap.to(nav, { autoAlpha: self.isActive ? 1 : 0, x: self.isActive ? 0 : 20, duration: 0.4 }),
        });
      }

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ---- Hero entrance: letters flip up in 3D, then everything else.
        const tl = gsap.timeline({ delay: 0.15 });
        tl.fromTo(
          "[data-svc-char]",
          { yPercent: 120, rotateX: -95, opacity: 0, transformOrigin: "50% 100% -30px" },
          { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, ease: "back.out(1.6)", stagger: { each: 0.028 } },
        )
          .fromTo("[data-svc-fade]", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", stagger: 0.1 }, 0.7)
          .fromTo("[data-svc-ringwrap]", { y: 160, autoAlpha: 0, scale: 0.85 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.8, ease: "expo.out" }, 0.6);

        // Rotating ticker words.
        const words = gsap.utils.toArray<HTMLElement>("[data-svc-tick]");
        if (words.length) {
          gsap.set(words, { yPercent: 110, opacity: 0 });
          const tk = gsap.timeline({ repeat: -1, delay: 1.2 });
          words.forEach((w) => {
            tk.to(w, { yPercent: 0, opacity: 1, duration: 0.55, ease: "back.out(2)" }).to(w, { yPercent: -110, opacity: 0, duration: 0.45, ease: "power3.in" }, "+=1.4");
          });
        }

        // ---- Chapters: cinematic reveals.
        chapters.forEach((ch, i) => {
          const fromLeft = i % 2 === 1;
          const vis = ch.querySelector<HTMLElement>("[data-svc-visual]");
          const t = gsap.timeline({ scrollTrigger: { trigger: ch, start: "top 70%", toggleActions: "play none none reverse" } });
          t.fromTo(ch.querySelectorAll("[data-svc-word]"), { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1, ease: "expo.out", stagger: 0.06 })
            .fromTo(ch.querySelectorAll("[data-svc-in]"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.08 }, 0.15)
            .fromTo(ch.querySelectorAll("[data-svc-bullet]"), { x: fromLeft ? 30 : -30, autoAlpha: 0, scale: 0.9 }, { x: 0, autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(2)", stagger: 0.1 }, 0.45);
          if (vis) {
            t.fromTo(
              vis,
              { clipPath: "inset(18% 18% 18% 18% round 40px)", rotateY: fromLeft ? 22 : -22, rotateX: 8, scale: 0.86, autoAlpha: 0 },
              { clipPath: "inset(0% 0% 0% 0% round 28px)", rotateY: 0, rotateX: 0, scale: 1, autoAlpha: 1, duration: 1.4, ease: "expo.out" },
              0,
            );
          }
          const num = ch.querySelector("[data-svc-num]");
          if (num) gsap.fromTo(num, { yPercent: 12 }, { yPercent: -12, ease: "none", scrollTrigger: { trigger: ch, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        });

        // ---- Process: the line draws itself and steps light up as you scroll.
        const proc = el.querySelector<HTMLElement>("[data-svc-process]");
        const steps = gsap.utils.toArray<HTMLElement>("[data-svc-step]");
        const procSpot = el.querySelector<HTMLElement>("[data-svc-procspot]");
        if (proc && steps.length) {
          gsap.set(steps, { opacity: 0.25, y: 20 });
          gsap
            .timeline({
              scrollTrigger: {
                trigger: proc,
                start: "top 65%",
                end: "bottom 60%",
                scrub: 0.6,
                onUpdate: (self) => {
                  if (procSpot) procSpot.style.left = `${8 + self.progress * 84}%`;
                },
              },
            })
            .fromTo("[data-svc-line]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0)
            .to(steps, { opacity: 1, y: 0, stagger: 0.25, duration: 0.2, ease: "none" }, 0.05);
        }
      });

      return () => {
        window.removeEventListener("pointermove", onMove);
        mm.revert();
      };
    },
    { scope: root },
  );

  // 3D tilt on the chapter visuals.
  const tilt = (e: RPointerEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    const r = t.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    t.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`;
  };
  const untilt = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "";
  };

  let charIndex = 0;
  const splitChars = (text: string, cls = "") =>
    text.split(" ").map((word, wi, arr) => (
      <span key={wi} className="inline-block whitespace-nowrap">
        {word.split("").map((ch) => (
          <span key={charIndex++} data-svc-char className={`inline-block ${cls}`} style={{ willChange: "transform" }}>
            {ch}
          </span>
        ))}
        {wi < arr.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
      </span>
    ));

  return (
    <div ref={root}>
      <style>{SVC_CSS + PAGE_CSS}</style>

      {/* ---------------- HERO ---------------- */}
      <section
        data-svc-hero
        data-sun-scene="hero"
        aria-labelledby="svc-title"
        className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ivory pt-28 md:pt-28"
      >
        {/* aurora light, fine grid and film grain */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="svc-blob" style={{ width: "46vw", height: "46vw", left: "-8vw", top: "-14vw", background: "#FFD66B", animationDuration: "18s" }} />
          <span className="svc-blob" style={{ width: "40vw", height: "40vw", right: "-10vw", top: "4vw", background: "#FFB067", animationDuration: "22s", animationDelay: "-6s" }} />
          <span className="svc-blob" style={{ width: "34vw", height: "34vw", left: "30vw", bottom: "-16vw", background: "#FFE8B8", animationDuration: "26s", animationDelay: "-12s" }} />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(35,27,24,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(35,27,24,0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_50%_35%,#000_10%,transparent_70%)]" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(520px circle at var(--mx,50%) var(--my,30%), rgba(255,255,255,0.7), transparent 60%)" }} />
          <div className="svc-grain absolute inset-0" />
        </div>

        <Container className="relative z-10 flex flex-col items-center text-center">
          <div data-svc-herocopy className="flex flex-col items-center">
            <p data-svc-fade className="svc-sheen relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/80 bg-white/70 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-espresso shadow-[0_10px_30px_-16px_rgba(35,27,24,0.35)] backdrop-blur">
              <span aria-hidden className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-flame" />
              </span>
              {servicesHero.eyebrow} · BrightSun SEO
            </p>
            <h1 id="svc-title" className="mt-6 font-hero text-[clamp(2.8rem,6.6vw,6.6rem)] font-extrabold leading-[0.92] tracking-[-0.055em] text-espresso" style={{ perspective: "900px" }}>
              <span className="block">{splitChars(servicesHero.titleTop)}</span>
              <span className="block">{splitChars(servicesHero.titleAccent, "svc-shimmer")}</span>
            </h1>
            <div data-svc-fade className="mt-5 flex h-[1.6em] items-center justify-center gap-3 overflow-hidden text-lg font-semibold text-espresso md:text-2xl">
              <span aria-hidden className="h-px w-10 bg-espresso/30" />
              <span className="relative h-full w-[13ch] text-flame">
                {servicesHero.ticker.map((t) => (
                  <span key={t} data-svc-tick className="absolute inset-x-0 top-0 whitespace-nowrap">
                    {t}
                  </span>
                ))}
              </span>
              <span aria-hidden className="h-px w-10 bg-espresso/30" />
            </div>
            <p data-svc-fade className="mt-4 max-w-xl text-lg leading-relaxed text-espresso/65">
              {servicesHero.intro}
            </p>
            <div data-svc-fade className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Button href="/contact">Start a project</Button>
              <Button href="#chapters" variant="secondary">
                Explore services
              </Button>
            </div>
          </div>
        </Container>

        {/* 3D carousel of the ten services */}
        <div data-svc-ringwrap className="relative mt-auto h-[300px] w-full md:h-[340px]" style={{ perspective: "1600px" }}>
          <div className="absolute left-1/2 top-[42%] h-0 w-0" style={{ transformStyle: "preserve-3d", transform: "translateZ(calc(-1 * min(620px, 48vw))) rotateX(-3deg)" }}>
            <div className="svc-ring" data-svc-ringspin style={{ transformStyle: "preserve-3d" }}>
              {serviceChapters.map((c, i) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="svc-ringcard group"
                  data-svc-rc={i}
                  style={{ transform: `translate(-50%,-50%) rotateY(${i * 36}deg) translateZ(var(--r))` }}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#FFC233,#FF8A1D)] font-hero text-sm font-extrabold text-espresso shadow-[inset_0_-4px_10px_rgba(255,138,29,0.5)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="svc-rc-grp text-[10px] font-bold uppercase tracking-[0.16em] text-espresso/45">{c.group}</span>
                  </span>
                  <span className="svc-rc-title mt-4 block font-hero text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-espresso">{c.title}</span>
                  <span className="mt-1.5 block text-[12px] font-semibold text-flame">{c.kicker}</span>
                  <span className="svc-rc-foot">
                    <span>Explore</span>
                    <i aria-hidden>→</i>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CHAPTERS ---------------- */}
      <div id="chapters" data-svc-chapters className="relative">
        {/* side navigation */}
        <nav data-svc-nav aria-label="Services" className="invisible fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2.5 opacity-0 xl:flex">
          {serviceChapters.map((c, i) => (
            <a key={c.id} href={`#${c.id}`} data-svc-dot className="group flex items-center justify-end gap-2" aria-label={c.title}>
              <span className="pointer-events-none whitespace-nowrap rounded-full bg-espresso px-2.5 py-1 text-[10px] font-semibold text-ivory opacity-0 transition group-hover:opacity-100">
                {String(i + 1).padStart(2, "0")} {c.title}
              </span>
              <span className="block h-2.5 w-2.5 rounded-full bg-espresso/20 transition-all duration-300 group-data-[on]:h-6 group-data-[on]:bg-flame" />
            </a>
          ))}
        </nav>

        {serviceChapters.map((c, i) => {
          const flip = i % 2 === 1;
          return (
            <section
              key={c.id}
              id={c.id}
              data-svc-chapter
              data-sun-scene={`svc-${i}`}
              data-sun-cue={c.cue}
              data-sun-cue-back={c.cue}
              aria-labelledby={`${c.id}-title`}
              className="relative flex min-h-[100svh] items-center overflow-hidden py-24"
              style={{ background: c.tint }}
            >

              <Container className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
                <div className={`relative isolate lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
                  {/* giant outlined number, centred behind the service name and text */}
                  <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
                    <span data-svc-num className="svc-outline block select-none font-hero text-[clamp(14rem,34vw,32rem)] font-extrabold leading-none tracking-[-0.04em]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <p data-svc-in className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-espresso/60">
                    <span className="rounded-full bg-espresso px-2 py-0.5 text-[10px] text-sun">{String(i + 1).padStart(2, "0")}</span>
                    {c.group}
                  </p>
                  <h2 id={`${c.id}-title`} className="mt-5 font-hero text-[clamp(2.3rem,4.6vw,4.4rem)] font-extrabold leading-[1] tracking-[-0.04em] text-espresso">
                    {c.title.split(" ").map((w, wi) => (
                      <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                        <span data-svc-word className="inline-block">
                          {w}
                        </span>
                      </span>
                    ))}
                  </h2>
                  <p data-svc-in className="mt-3 font-hero text-xl font-bold text-flame">
                    {c.kicker}
                  </p>
                  <p data-svc-in className="mt-5 max-w-md text-lg leading-relaxed text-espresso/70">
                    {c.description}
                  </p>
                  <ul className="mt-7 flex flex-wrap gap-2.5">
                    {c.bullets.map((b) => (
                      <li key={b} data-svc-bullet className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-espresso shadow-[0_8px_20px_-14px_rgba(35,27,24,0.45)]">
                        <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-flame text-[9px] text-white">
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link data-svc-in href="/contact" className="mt-8 inline-flex items-center gap-2 font-semibold text-espresso underline decoration-sun decoration-[3px] underline-offset-[6px] transition hover:text-flame">
                    Talk to us about {c.kicker.length < 8 ? c.kicker : c.title} →
                  </Link>
                </div>

                <div className={`relative lg:col-span-6 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`} style={{ perspective: "1200px" }}>
                  {/* Sunny's spot for this chapter, at the card's outer top corner */}
                  <span data-sun-spot={`svc-${i}`} aria-hidden className={`absolute -top-24 hidden h-px w-px lg:block ${flip ? "left-24" : "right-24"}`} />
                  <div data-svc-visual className="relative" style={{ transformStyle: "preserve-3d" }}>
                    <div
                      onPointerMove={tilt}
                      onPointerLeave={untilt}
                      className="aspect-[4/3] w-full rounded-[28px] bg-white p-2 shadow-[0_40px_80px_-40px_rgba(35,27,24,0.55)] ring-1 ring-espresso/5 transition-transform duration-300 ease-out"
                    >
                      <SvcVisual kind={c.visual} />
                    </div>
                  </div>
                </div>
              </Container>
            </section>
          );
        })}
      </div>

      {/* ---------------- PROCESS ---------------- */}
      <section data-svc-process data-sun-scene="svc-process" data-sun-cue="celebrate" aria-labelledby="svc-process-title" className="relative overflow-hidden bg-cream py-28 text-espresso md:py-36">
        <Container>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-flame">How we work</p>
          <h2 id="svc-process-title" className="mt-4 max-w-3xl font-hero text-[clamp(2.4rem,5vw,4.6rem)] font-extrabold leading-[1] tracking-[-0.04em]">
            Simple steps. <span className="svc-shimmer">Bright results.</span>
          </h2>
          <div className="relative mt-20">
            <div className="absolute left-0 right-0 top-5 h-[3px] rounded-full bg-espresso/10" />
            <div data-svc-line className="absolute left-0 right-0 top-5 h-[3px] origin-left rounded-full bg-[linear-gradient(90deg,#FFC233,#FF8A1D)]" />
            <span data-svc-procspot data-sun-spot="svc-process" aria-hidden className="absolute -top-24 hidden h-px w-px md:block" style={{ left: "8%" }} />
            <ol className="relative grid gap-10 md:grid-cols-4">
              {processSteps.map((s, i) => (
                <li key={s.title} data-svc-step>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sun font-hero text-lg font-extrabold text-espresso shadow-[0_0_0_6px_rgba(255,194,51,0.2)]">{i + 1}</span>
                  <h3 className="mt-6 font-hero text-2xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-espresso/65">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* ---------------- FINALE ---------------- */}
      <section data-sun-scene="svc-cta" data-sun-cue="celebrate" aria-labelledby="svc-cta-title" className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#FFE29A,#FFC233_45%,#FF8A1D)] py-24 md:py-32">
        <div aria-hidden className="svc-rays opacity-60" style={{ width: "120vmax" }} />
        <Container className="relative grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="svc-cta-title" className="font-hero text-[clamp(3rem,7vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-espresso">
              {"Ready to".split("").map((ch, i) => (
                <span key={i} className="svc-wave-ch inline-block" style={{ animation: `svc-wave 1.6s ease-in-out ${i * 0.07}s infinite` }}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
              <br />
              {"shine?".split("").map((ch, i) => (
                <span key={i} className="svc-wave-ch inline-block text-white" style={{ animation: `svc-wave 1.6s ease-in-out ${0.6 + i * 0.07}s infinite` }}>
                  {ch}
                </span>
              ))}
            </h2>
            <p className="mt-6 max-w-md text-lg text-espresso/75">Tell us what you need. We&apos;ll come back with a clear, honest plan.</p>
            <span data-sun-spot="svc-cta" aria-hidden className="ml-24 mt-36 hidden h-px w-px lg:block" />
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-[0_40px_80px_-40px_rgba(35,27,24,0.6)] md:p-8 lg:col-span-6">
            <ContactForm />
          </div>
        </Container>
      </section>

      {/* off-screen size reference for the companion dock (no big Sunny on this page) */}
      <div data-sun-slot aria-hidden className="pointer-events-none invisible fixed left-0 top-0 h-[572px] w-[520px]" />
      <SunnyCompanion silent alwaysMini />
    </div>
  );
}
