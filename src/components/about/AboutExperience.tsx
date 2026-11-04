"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { SunnyCompanion } from "@/components/mascot/SunnyCompanion";
import { cueSunny } from "@/components/mascot/mascotState";
import dynamic from "next/dynamic";
const EyePortrait = dynamic(() => import("@/components/about/EyePortrait"), { ssr: false });
import { aboutHero, chapters, founders, type Beat, type Mood } from "@/data/aboutStory";

const THEME: Record<Mood, { bg: string; fg: string; accent: string; sun: string; sunY: [number, number]; sunO: [number, number]; sunS: [number, number] }> = {
  night: { bg: "radial-gradient(ellipse at 50% 125%, #3a2414 0%, #1a110e 46%, #0e0908 100%)", fg: "#FFF8EA", accent: "#FFC233", sun: "rgba(255,138,29,.55)", sunY: [30, 24], sunO: [0.12, 0.2], sunS: [0.5, 0.6] },
  dusk: { bg: "radial-gradient(ellipse at 50% 118%, #8a3b12 0%, #3a1c10 46%, #170e0b 100%)", fg: "#FFF8EA", accent: "#FFC233", sun: "rgba(255,138,29,.7)", sunY: [26, 10], sunO: [0.25, 0.5], sunS: [0.6, 0.8] },
  dawn: { bg: "radial-gradient(ellipse at 50% 108%, #FF8A1D 0%, #7a3a14 40%, #261813 100%)", fg: "#FFF8EA", accent: "#FFE29A", sun: "rgba(255,194,51,.85)", sunY: [18, -8], sunO: [0.45, 0.85], sunS: [0.8, 1.05] },
  gold: { bg: "linear-gradient(180deg,#FFE9B0 0%,#FFC233 52%,#FF9A2B 100%)", fg: "#231b18", accent: "#B34700", sun: "rgba(255,255,255,.75)", sunY: [8, -26], sunO: [0.7, 1], sunS: [1, 1.3] },
};

const PAGE_CSS = `
.ab-grain{background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>");mix-blend-mode:overlay;opacity:.09;animation:ab-grain 1.2s steps(6) infinite}
@keyframes ab-grain{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,3%)}100%{transform:translate(0,0)}}
@keyframes ab-shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
.ab-shimmer{background:linear-gradient(100deg,#FF8A1D 0%,#FFC233 30%,#FFF2C2 50%,#FFC233 70%,#FF8A1D 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ab-shimmer 5s linear infinite}
.ab-outline{-webkit-text-stroke:2px currentColor;color:transparent}
.ab-glass{background:linear-gradient(155deg,rgba(255,255,255,.09),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,248,234,.14)}
@media (prefers-reduced-motion: reduce){.ab-grain,.ab-shimmer{animation:none!important}}
`;

const words = (text: string) =>
  text.split(" ").map((w, i) => (
    <span key={i} data-w className="mr-[0.26em] inline-block will-change-transform">
      {w}
    </span>
  ));

const chars = (text: string, attr: string) =>
  text.split(" ").map((w, wi, arr) => (
    <span key={wi} className="inline-block whitespace-nowrap">
      {w.split("").map((c, ci) => (
        <span key={ci} {...{ [attr]: "" }} className="inline-block">
          {c}
        </span>
      ))}
      {wi < arr.length - 1 ? " " : ""}
    </span>
  ));

const titleChars = (text: string) =>
  text.split(" ").map((w, wi) => (
    <span key={wi} data-tw className="mr-[0.26em] inline-block whitespace-nowrap">
      {w.split("").map((c, ci) => (
        <span key={ci} data-tc className="inline-block will-change-transform">
          {c}
        </span>
      ))}
    </span>
  ));

/** One different entrance for each chapter header. Each returns how long the header stays. */
type Q = (tl: gsap.core.Timeline, card: HTMLElement, at: number) => void;
const TITLE_ANIMS: Q[] = [
  // I  falls apart: letters tumble down and settle, then drift slightly out of place
  (tl, card, at) => {
    const ch = card.querySelectorAll("[data-tc]");
    tl.fromTo(ch, { y: -220, rotation: () => gsap.utils.random(-80, 80), opacity: 0, filter: "blur(8px)" }, { y: 0, rotation: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "bounce.out", stagger: { each: 0.05, from: "random" } }, at);
    tl.to(ch, { y: () => gsap.utils.random(4, 16), rotation: () => gsap.utils.random(-5, 5), duration: 1.4, ease: "power1.inOut", stagger: { each: 0.02, from: "random" } }, at + 2.3);
  },
  // II  the voice: letters ring out from the centre like a sound wave
  (tl, card, at) => {
    const ch = card.querySelectorAll("[data-tc]");
    tl.fromTo(ch, { opacity: 0, scaleY: 0.05, transformOrigin: "50% 50%" }, { opacity: 1, scaleY: 1, duration: 1, ease: "elastic.out(1,0.45)", stagger: { each: 0.05, from: "center" } }, at);
    tl.fromTo(card.querySelectorAll("[data-ring]"), { autoAlpha: 0.7, scale: 0.2 }, { autoAlpha: 0, scale: 2.2, duration: 2, ease: "power1.out", stagger: 0.5 }, at + 0.2);
  },
  // III  an upside-down pyramid: the whole title starts flipped and swings the right way up
  (tl, card, at) => {
    const h = card.querySelector("[data-ct]");
    const ch = card.querySelectorAll("[data-tc]");
    tl.fromTo(h, { rotation: 180, opacity: 0, y: -60 }, { rotation: 0, opacity: 1, y: 0, duration: 1.6, ease: "power3.inOut" }, at);
    tl.fromTo(ch, { rotationX: 90 }, { rotationX: 0, duration: 0.9, ease: "back.out(1.8)", stagger: 0.03 }, at + 0.9);
  },
  // IV  two people: half the words arrive from the left, half from the right, and meet
  (tl, card, at) => {
    const tw = Array.from(card.querySelectorAll("[data-tw]"));
    const half = Math.ceil(tw.length / 2);
    tl.fromTo(tw.slice(0, half), { x: -420, opacity: 0, filter: "blur(10px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, ease: "expo.out", stagger: 0.12 }, at);
    tl.fromTo(tw.slice(half), { x: 420, opacity: 0, filter: "blur(10px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, ease: "expo.out", stagger: 0.12 }, at);
  },
  // V  tested: letters slam in heavy and the whole screen shakes
  (tl, card, at) => {
    tl.fromTo(card.querySelectorAll("[data-tc]"), { scale: 2.8, opacity: 0, filter: "blur(14px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power4.in", stagger: { each: 0.045, from: "random" } }, at);
    tl.fromTo(card, { x: 0 }, { keyframes: [{ x: -12, duration: 0.05 }, { x: 10, duration: 0.05 }, { x: -7, duration: 0.05 }, { x: 5, duration: 0.05 }, { x: 0, duration: 0.08 }], ease: "none" }, at + 0.9);
  },
  // VI  raising the bar: letters rise out of a mask and a gold bar grows beneath
  (tl, card, at) => {
    const tw = card.querySelectorAll("[data-tw]");
    gsap.set(tw, { overflow: "hidden", paddingBottom: "0.14em", marginBottom: "-0.14em" });
    tl.fromTo(card.querySelectorAll("[data-tc]"), { yPercent: 125 }, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.035 }, at);
    tl.fromTo(card.querySelector("[data-bar]"), { autoAlpha: 0, scaleY: 0.1, scaleX: 0.3 }, { autoAlpha: 1, scaleY: 1, scaleX: 1, duration: 0.9, ease: "back.out(2)" }, at + 0.9);
  },
  // VII  why the risk: lights flicker on, one letter at a time, in the dark
  (tl, card, at) => {
    tl.fromTo(card.querySelectorAll("[data-tc]"), { opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.08 }, { opacity: 0.05, duration: 0.1 }, { opacity: 1, duration: 0.07 }, { opacity: 0.3, duration: 0.12 }, { opacity: 1, duration: 0.25 }], ease: "none", stagger: { each: 0.07, from: "random" } }, at);
  },
  // VIII  a story to tell: words come in softly one by one, with a gentle glow
  (tl, card, at) => {
    const h = card.querySelector("[data-ct]");
    tl.fromTo(card.querySelectorAll("[data-tw]"), { opacity: 0, y: 24, scale: 0.94, filter: "blur(16px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.3, ease: "power2.out", stagger: 0.5 }, at);
    tl.to(h, { textShadow: "0 0 46px rgba(255,194,51,.6)", duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, at + 1.2);
  },
  // IX  the star who stayed: a sunrise wipe lights the title, and stars twinkle around it
  (tl, card, at) => {
    const h = card.querySelector("[data-ct]");
    tl.fromTo(h, { clipPath: "inset(110% -5% -10% -5%)" }, { clipPath: "inset(-15% -5% -15% -5%)", duration: 1.5, ease: "power3.out" }, at);
    tl.fromTo(card.querySelectorAll("[data-tc]"), { y: 50, opacity: 0, scale: 0.7 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)", stagger: 0.035 }, at + 0.1);
    tl.fromTo(card.querySelectorAll("[data-star]"), { autoAlpha: 0, scale: 0, rotation: -90 }, { autoAlpha: 1, scale: 1.2, rotation: 0, duration: 0.7, ease: "back.out(3)", stagger: 0.22, yoyo: true, repeat: 1 }, at + 1.1);
    tl.to(h, { textShadow: "0 0 50px rgba(255,255,255,.9)", duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, at + 1.4);
  },
];

function BeatView({ beat, accent, fg }: { beat: Beat; accent: string; fg: string }) {
  if (beat.kind === "products") {
    return (
      <div className="grid w-full max-w-6xl gap-4 px-5 md:grid-cols-3">
        {beat.lines.map((l, i) => {
          const [name, desc] = l.split("|");
          return (
            <div key={i} data-line className="ab-glass rounded-3xl p-6 md:p-7">
              <p className="font-hero text-3xl font-extrabold md:text-4xl" style={{ color: accent }}>{name}</p>
              <p className="mt-3 text-base leading-snug md:text-lg" style={{ color: fg, opacity: 0.85 }}>{desc}</p>
            </div>
          );
        })}
      </div>
    );
  }
  const cls =
    beat.kind === "stinger"
      ? "font-hero text-[clamp(2.4rem,7.2vw,6.6rem)] font-extrabold leading-[0.98] tracking-[-0.045em]"
      : beat.kind === "quote"
        ? "font-hero text-[clamp(1.6rem,3.7vw,3.1rem)] font-bold italic leading-[1.18] tracking-[-0.02em]"
        : "font-hero text-[clamp(1.35rem,3.05vw,2.55rem)] font-semibold leading-[1.22] tracking-[-0.025em]";
  return (
    <div className="mx-auto w-full max-w-5xl px-6 text-center">
      {beat.lines.map((l, i) => (
        <p key={i} data-line className={`${cls} ${i > 0 ? "mt-[0.55em]" : ""}`} style={{ color: beat.kind === "text" ? fg : accent, opacity: beat.kind === "text" && i > 0 ? 0.82 : 1 }}>
          {words(l)}
        </p>
      ))}
    </div>
  );
}

function FounderCard({ id, name, full, role, line }: { id: string; name: string; full: string; role: string; line: string }) {
  return (
    <div data-fcard className="flex flex-col items-center text-center">
      <div data-fport className="relative w-[min(78vw,380px)] md:w-[min(34vw,440px)]">
        <span aria-hidden className="absolute left-1/2 top-1/2 -z-0 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,194,51,.34),transparent_65%)]" />
        <div className="relative z-10"><EyePortrait kind={id === "arun" ? "arun" : "swathi"} label={`${name}, ${role} of BrightSun`} /></div>
      </div>
      <p data-frole className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] text-sun">{role}</p>
      <h3 className="mt-2 font-hero text-[clamp(2.4rem,5.6vw,4.6rem)] font-extrabold leading-none tracking-[-0.045em] text-ivory">
        {chars(name, "data-fch")}
      </h3>
      <p data-fsub className="mt-2 text-sm font-semibold tracking-[0.12em] text-ivory/50">{full}</p>
      <p data-fsub className="mt-3 max-w-xs text-base text-ivory/70">{line}</p>
    </div>
  );
}

const SPEEDS = [1, 1.5, 2] as const;

const Icon = {
  play: <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M8 5v14l11-7z" /></svg>,
  pause: <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>,
  prev: <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6 6h2v12H6zM9.5 12 18 18V6z" /></svg>,
  next: <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></svg>,
};

export function AboutExperience() {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const startsRef = useRef<number[]>([]);
  const userPaused = useRef(false);
  const inView = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [done, setDone] = useState(false);

  const barFill = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<number[]>([]);
  const jumpTo = (i: number) => {
    const tl = tlRef.current;
    if (!tl) return;
    setDone(false); userPaused.current = false;
    tl.seek(startsRef.current[i] + (i === 0 ? 0 : 0.9)); tl.play();
  };
  const restart = () => {
    const tl = tlRef.current;
    if (!tl) return;
    setDone(false); userPaused.current = false;
    tl.seek(0); tl.play();
  };
  const skip = (sec: number) => {
    const tl = tlRef.current;
    if (!tl) return;
    setDone(false);
    tl.seek(Math.max(0, Math.min(tl.duration() - 0.5, tl.time() + sec)));
    userPaused.current = false;
    tl.play();
  };
  const seekTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const tl = tlRef.current;
    if (!tl) return;
    const r = e.currentTarget.getBoundingClientRect();
    setDone(false);
    tl.progress(Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width)));
    userPaused.current = false;
    tl.play();
  };
  const toggle = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (done || tl.progress() >= 1) { restart(); return; }
    if (tl.paused() || !tl.isActive()) { userPaused.current = false; tl.play(); }
    else { userPaused.current = true; tl.pause(); }
  };
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length];
    setSpeed(next);
    tlRef.current?.timeScale(next);
  };
  const toFounders = () => document.querySelector("[data-founders]")?.scrollIntoView({ behavior: "smooth" });
  const toFilm = () => document.querySelector("[data-film]")?.scrollIntoView({ behavior: "smooth" });

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ---- hero ----
        gsap.fromTo("[data-ab-hc]", { opacity: 0, y: 70, rotateX: -70, filter: "blur(12px)" }, { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: 0.025, delay: 0.3 });
        gsap.fromTo("[data-ab-fade]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.25, delay: 1.1 });

        // ---- the film: ONE master timeline that plays by itself, like a video ----
        const WORD = 0.12; // seconds per word, as if narrated
        const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
        const starts: number[] = [];
        let base = 0;
        const layers = chapters.map((_, ci) => el.querySelector<HTMLElement>(`[data-chl="${ci}"]`)!);
        gsap.set(layers, { autoAlpha: 0 });
        gsap.set(el.querySelectorAll("[data-card], [data-beat]"), { autoAlpha: 0 });
        gsap.set(el.querySelectorAll("[data-ring], [data-star], [data-bar]"), { autoAlpha: 0 });

        chapters.forEach((ch, ci) => {
          const th = THEME[ch.mood];
          const layer = layers[ci];
          const sun = layer.querySelector<HTMLElement>("[data-sun]")!;
          const beatEls = Array.from(layer.querySelectorAll<HTMLElement>("[data-beat]"));
          starts.push(base);
          // the picture melts from one scene into the next: no title cards, one continuous film
          tl.fromTo(layer, { autoAlpha: 0 }, { autoAlpha: 1, duration: ci === 0 ? 1.6 : 2.4, ease: "none" }, base);
          if (ci > 0) tl.set(layers[ci - 1], { autoAlpha: 0 }, base + 2.4);

          // the chapter header: its own entrance, then it melts away
          const card = layer.querySelector<HTMLElement>("[data-card]")!;
          const at = base + (ci === 0 ? 0.7 : 1.2);
          tl.set(card, { autoAlpha: 1 }, at);
          TITLE_ANIMS[ci % TITLE_ANIMS.length](tl, card, at);
          tl.to(card, { scale: 1.05, duration: 5, ease: "none" }, at);
          tl.to(card, { autoAlpha: 0, filter: "blur(14px)", duration: 0.9, ease: "power2.in" }, at + 3.9);
          let cursor = at + 4.9;
          beatEls.forEach((be) => {
            const lines = Array.from(be.querySelectorAll<HTMLElement>("[data-line]"));
            const start = cursor;
            tl.set(be, { autoAlpha: 1 }, start);
            let t = start, wc = 0;
            lines.forEach((ln) => {
              const w = ln.querySelectorAll("[data-w]");
              const targets = w.length ? Array.from(w) : [ln];
              tl.fromTo(targets, { opacity: 0, y: 14, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: w.length ? WORD : 0, ease: "power2.out" }, t);
              const n = w.length || 4;
              wc += n;
              t += n * WORD + 0.35;
            });
            const stinger = be.dataset.kind === "stinger";
            const outAt = t + 0.55 + wc * 0.05 + (stinger ? 0.9 : 0);
            tl.to(be, { autoAlpha: 0, y: -22, filter: "blur(10px)", duration: 0.6, ease: "power2.in" }, outAt);
            tl.fromTo(be, { scale: 0.98 }, { scale: 1.03, duration: outAt + 0.6 - start, ease: "none" }, start); // slow camera push-in
            cursor = outAt + 0.75;
          });
          tl.fromTo(sun, { yPercent: th.sunY[0], opacity: th.sunO[0], scale: th.sunS[0] }, { yPercent: th.sunY[1], opacity: th.sunO[1], scale: th.sunS[1], duration: cursor - base + 2.4, ease: "none" }, base);
          base = cursor - 0.4;
        });
        startsRef.current = starts;
        setMarks(starts.map((st) => st / tl.duration()));
        tlRef.current = tl;
        (window as unknown as { __abFilm?: unknown }).__abFilm = { tl, starts };
        tl.eventCallback("onUpdate", () => {
          if (barFill.current) barFill.current.style.width = `${tl.progress() * 100}%`;
          const t = tl.time();
          dotsRef.current?.childNodes.forEach((d, i) => {
            const on = t >= starts[i] - 0.01;
            (d as HTMLElement).style.background = on ? "#FFC233" : "rgba(255,248,234,.45)";
          });
        });
        tl.eventCallback("onComplete", () => {
          setDone(true); setPlaying(false);
          cueSunny("celebrate");
          window.setTimeout(() => { if (inView.current && !userPaused.current) toFounders(); }, 4500);
        });

        // play when the film is on screen, pause when the visitor leaves
        ScrollTrigger.create({
          trigger: "[data-film]",
          start: "top 45%",
          end: "bottom 55%",
          onEnter: () => { inView.current = true; if (!userPaused.current && tl.progress() < 1) { tl.play(); setPlaying(true); } },
          onEnterBack: () => { inView.current = true; if (!userPaused.current && tl.progress() < 1) { tl.play(); setPlaying(true); } },
          onLeave: () => { inView.current = false; tl.pause(); setPlaying(false); },
          onLeaveBack: () => { inView.current = false; tl.pause(); setPlaying(false); },
        });
        // keep the play button honest
        const sync = () => setPlaying(!tl.paused() && tl.progress() < 1);
        gsap.ticker.add(sync);

        // ---- founders ----
        gsap.fromTo("[data-fi]", { opacity: 0, y: 50, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: "[data-founders]", start: "top 65%", once: true } });
        el.querySelectorAll<HTMLElement>("[data-fcard]").forEach((card, i) => {
          const fl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 78%", once: true } });
          fl.fromTo(card.querySelector("[data-fport]"), { opacity: 0, y: 90, scale: 0.9, filter: "brightness(0) blur(14px)" }, { opacity: 1, y: 0, scale: 1, filter: "brightness(1) blur(0px)", duration: 1.6, ease: "expo.out" }, i * 0.1);
          fl.fromTo(card.querySelector("[data-frole]"), { opacity: 0, letterSpacing: "0.9em" }, { opacity: 1, letterSpacing: "0.3em", duration: 1.2, ease: "power3.out" }, 0.7);
          fl.fromTo(card.querySelectorAll("[data-fch]"), { opacity: 0, y: 60, rotateX: -80, filter: "blur(10px)" }, { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)", duration: 1, stagger: 0.045, ease: "expo.out" }, 0.9);
          fl.fromTo(card.querySelectorAll("[data-fsub]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 }, 1.5);
        });
        ScrollTrigger.create({ trigger: "[data-founders]", start: "top 60%", once: true, onEnter: () => cueSunny("wk-bow") });

        return () => { gsap.ticker.remove(sync); tlRef.current = null; };
      });

      // reduced motion: the whole story is simply laid out to read
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el.querySelectorAll("[data-chl], [data-card], [data-beat]"), { clearProps: "all" });
        gsap.set(el.querySelectorAll("[data-ring], [data-star], [data-bar]"), { display: "none" });
        el.setAttribute("data-static", "1");
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="group bg-[#0e0908] text-ivory">
      <style>{PAGE_CSS}</style>

      {/* ---------------- HERO ---------------- */}
      <section data-ab-hero data-sun-scene="hero" aria-labelledby="ab-title" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_120%,#5a2c12_0%,#1a110e_50%,#0e0908_100%)]">
        <span aria-hidden className="pointer-events-none absolute bottom-[-35%] left-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,138,29,.5),transparent_62%)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center" style={{ perspective: "900px" }}>
          <p data-ab-fade className="text-xs font-extrabold uppercase tracking-[0.34em] text-sun">{aboutHero.eyebrow}</p>
          <h1 id="ab-title" className="mt-6 font-hero text-[clamp(2.6rem,8.2vw,8rem)] font-extrabold leading-[0.94] tracking-[-0.05em]">
            {chars(aboutHero.title, "data-ab-hc")}
          </h1>
          <p data-ab-fade className="mx-auto mt-8 max-w-2xl text-base text-ivory/70 md:text-xl">{aboutHero.tagline}</p>
          <button data-ab-fade type="button" onClick={toFilm} className="mt-12 inline-flex items-center gap-3 rounded-full bg-sun px-8 py-4 text-sm font-bold text-espresso shadow-[0_18px_40px_-16px_rgba(255,194,51,0.7)] transition hover:-translate-y-0.5">
            <span aria-hidden className="text-base">▶</span> Watch our story
          </button>
        </div>
        <div aria-hidden className="ab-grain pointer-events-none absolute -inset-[10%]" />
      </section>

      {/* ---------------- THE FILM (plays by itself) ---------------- */}
      <section data-film aria-label="Our story, narrated as a film" className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#0a0605] group-data-[static]:h-auto">
        {chapters.map((ch, ci) => {
          const th = THEME[ch.mood];
          return (
            <div key={ch.id} data-chl={ci} className="absolute inset-0 group-data-[static]:relative group-data-[static]:min-h-[100svh] group-data-[static]:py-24" style={{ background: th.bg, color: th.fg }}>
              <span data-sun aria-hidden className="pointer-events-none absolute bottom-[-30%] left-1/2 h-[110vmin] w-[110vmin] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${th.sun}, transparent 62%)` }} />
              <div data-card className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center group-data-[static]:relative group-data-[static]:mb-16 group-data-[static]:min-h-[40svh]" style={{ perspective: "900px" }}>
                {[0, 1, 2].map((r) => (
                  <span key={r} data-ring aria-hidden className="absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] rounded-full border-2" style={{ marginLeft: "-23vmin", marginTop: "-23vmin", borderColor: th.accent }} />
                ))}
                {[["12%", "26%"], ["84%", "30%"], ["18%", "74%"], ["80%", "70%"]].map(([l, t], k) => (
                  <span key={k} data-star aria-hidden className="absolute text-4xl" style={{ left: l, top: t, color: th.accent }}>✦</span>
                ))}
                <h2 data-ct className="relative max-w-5xl font-hero text-[clamp(2.4rem,7vw,6.4rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">{titleChars(ch.title)}</h2>
                <span data-bar aria-hidden className="mt-7 block h-2 w-36 rounded-full" style={{ background: th.accent }} />
              </div>
              {ch.beats.map((b, bi) => (
                <div key={bi} data-beat data-kind={b.kind} className="absolute inset-0 flex items-center justify-center py-[12svh] will-change-transform group-data-[static]:relative group-data-[static]:py-8">
                  <BeatView beat={b} accent={th.accent} fg={th.fg} />
                </div>
              ))}
            </div>
          );
        })}

        <div aria-hidden className="ab-grain pointer-events-none absolute -inset-[10%] z-10" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[8svh] bg-[#0a0605]" />

        {/* click anywhere on the picture to play / pause */}
        <button type="button" onClick={toggle} aria-label={playing ? "Pause the film" : "Play the film"} className="absolute inset-0 z-[15] cursor-pointer group-data-[static]:hidden" />

        {/* film controls in the bottom cinema bar */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex h-[76px] flex-col justify-center gap-2 bg-[#0a0605] px-4 md:px-10 group-data-[static]:hidden">
          <div role="slider" aria-label="Film progress" aria-valuemin={0} aria-valuemax={100} tabIndex={0} onPointerDown={seekTo} className="group/bar relative h-3 w-full cursor-pointer">
            <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/15" />
            <span ref={barFill} className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-sun" style={{ width: "0%" }} />
            {/* one point per header: click to jump to it */}
            <div ref={dotsRef}>
              {marks.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Jump to: ${chapters[i].title}`}
                  title={chapters[i].title}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => jumpTo(i)}
                  className="absolute top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0a0605] transition-transform hover:scale-150"
                  style={{ left: `${Math.min(99.2, Math.max(0.8, m * 100))}%`, background: "rgba(255,248,234,.45)" }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span aria-hidden className="hidden w-32 md:block" />
            <div className="mx-auto flex items-center gap-2 md:mx-0">
              <button type="button" onClick={() => skip(-12)} aria-label="Back 12 seconds" className="grid h-9 w-9 place-items-center rounded-full text-ivory/80 transition hover:bg-white/10 hover:text-ivory">{Icon.prev}</button>
              <button type="button" onClick={toggle} aria-label={playing ? "Pause" : done ? "Replay" : "Play"} className="grid h-11 w-11 place-items-center rounded-full bg-sun text-espresso shadow-[0_10px_30px_-10px_rgba(255,194,51,.8)] transition hover:scale-105">
                {done ? <span className="text-xs font-extrabold">↺</span> : playing ? Icon.pause : Icon.play}
              </button>
              <button type="button" onClick={() => skip(12)} aria-label="Forward 12 seconds" className="grid h-9 w-9 place-items-center rounded-full text-ivory/80 transition hover:bg-white/10 hover:text-ivory">{Icon.next}</button>
            </div>
            <div className="flex w-32 justify-end">
              <button type="button" onClick={cycleSpeed} aria-label="Playback speed" className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-bold text-ivory/80 transition hover:border-sun hover:text-sun">{speed}×</button>
            </div>
          </div>
        </div>

        {/* end of film */}
        {done && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0605]/70 px-6 text-center backdrop-blur-sm group-data-[static]:hidden">
            <p className="font-hero text-[clamp(1.8rem,4.4vw,3.4rem)] font-extrabold leading-tight">…and the story is still being written.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={toFounders} className="rounded-full bg-sun px-7 py-3.5 text-sm font-bold text-espresso">Meet the two →</button>
              <button type="button" onClick={restart} className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-ivory/85 hover:border-sun hover:text-sun">↺ Watch again</button>
            </div>
          </div>
        )}
      </section>

      {/* ---------------- THE TWO ---------------- */}
      <section data-founders aria-labelledby="ab-founders" className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#3a2012_0%,#0e0908_62%)] py-28 md:py-40">
        <Container className="relative z-10">
          <div className="text-center">
            <p data-fi className="text-xs font-extrabold uppercase tracking-[0.34em] text-sun">{founders.intro.eyebrow}</p>
            <h2 id="ab-founders" data-fi className="mt-5 font-hero text-[clamp(3rem,9vw,8rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">
              <span className="ab-shimmer">{founders.intro.title}</span>
            </h2>
          </div>
          <div className="mt-16 grid items-start gap-20 md:mt-24 md:grid-cols-2 md:gap-10">
            {[founders.people[1], founders.people[0]].map((p) => (
              <FounderCard key={p.id} {...p} />
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-sun px-8 py-4 text-sm font-bold text-espresso shadow-[0_18px_40px_-16px_rgba(255,194,51,0.7)] transition hover:-translate-y-0.5">
              Start your chapter with us <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
        <div aria-hidden className="ab-grain pointer-events-none absolute -inset-[10%]" />
      </section>

      <div data-sun-slot aria-hidden className="pointer-events-none invisible fixed left-0 top-0 h-[572px] w-[520px]" />
      <SunnyCompanion silent alwaysMini />
    </div>
  );
}
