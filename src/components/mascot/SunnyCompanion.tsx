"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { MascotStage } from "@/components/mascot/MascotStage";
import { cueSunny, mascotState } from "@/components/mascot/mascotState";
import { getCaption, getNeedsTap, isMuted, setMuted, setSilentPage, subscribeMute, subscribeVoice, sunnyNarrate, sunnyReplay } from "@/components/mascot/sunnyAudio";

const CALM_KEY = "brightsun:calm-sunny";
const HEADER_H = 92;
const EDGE = 14;

// "Calm Sunny" preference: persisted in localStorage, shared via a tiny store.
const CALM_EVENT = "brightsun:calm-change";
let memCalm = false; // fallback when storage is blocked
function readCalm() {
  try {
    return window.localStorage.getItem(CALM_KEY) === "1";
  } catch {
    return memCalm;
  }
}
function writeCalm(v: boolean) {
  memCalm = v;
  try {
    window.localStorage.setItem(CALM_KEY, v ? "1" : "0");
  } catch {
    /* storage unavailable: keep for this page view only */
  }
  window.dispatchEvent(new Event(CALM_EVENT));
}
function subscribeCalm(cb: () => void) {
  window.addEventListener(CALM_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CALM_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const smoothstep = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/**
 * One persistent Sunny for the whole homepage.
 *
 * The WebGL stage is mounted once in a fixed "dock". In the hero the dock
 * sits exactly over the hero's placeholder slot (`[data-sun-slot]`), so
 * Sunny looks like part of the layout. Scrolling out of the hero morphs the
 * dock (transform only — the canvas is never resized or remounted) into a
 * small floating companion that travels between per-scene spots
 * (`[data-sun-spot="…"]`). Scenes are sections marked `data-sun-scene`;
 * entering one can cue an act (`data-sun-cue`, comma-separated, played in
 * order). Scrolling back up reverses into the large hero Sunny.
 */
export function SunnyCompanion({ silent = false, alwaysMini = false }: { silent?: boolean; alwaysMini?: boolean } = {}) {
  // Silent pages (Services): Sunny acts but never talks; no mute / replay buttons.
  useEffect(() => {
    setSilentPage(silent);
    return () => setSilentPage(false);
  }, [silent]);
  const dock = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [mini, setMini] = useState(false);
  const calm = useSyncExternalStore(subscribeCalm, readCalm, () => false);

  // Keep the character's director in sync with the visitor's preference.
  useEffect(() => {
    mascotState.calm = calm;
  }, [calm]);

  const toggleCalm = () => writeCalm(!calm);
  const muted = useSyncExternalStore(subscribeMute, isMuted, () => false);
  const muteBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const b = muteBtn.current;
      if (b) {
        const x = mascotState.topX;
        const y = mascotState.topY;
        const onScreen = x >= 0 && y > -40 && y < window.innerHeight + 40;
        if (onScreen) {
          b.style.left = `${Math.max(70, Math.min(window.innerWidth - 70, x))}px`;
          b.style.top = `${Math.max(44, y - 6)}px`;
          b.style.visibility = "visible";
        } else b.style.visibility = "hidden";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const caption = useSyncExternalStore(subscribeVoice, getCaption, () => "");
  const needsTap = useSyncExternalStore(subscribeVoice, getNeedsTap, () => false);

  // Welcome gate: browsers only allow sound after one click, so the visitor's click on
  // "Meet Sunny" is also what starts his roll-in. Voice and movement then begin together.
  const [gate, setGate] = useState<"off" | "on" | "leaving">("off");
  const gateRef = useRef<"off" | "on" | "leaving">("off");
  // (The old welcome screen is replaced by the logo intro — see HomeIntro. Its "Meet Sunny"
  // click is the gesture that unlocks sound, so no second gate is shown.)
  useEffect(() => {
    if (gate === "on" && !needsTap) {
      gateRef.current = "leaving";
      setGate("leaving");
    }
  }, [gate, needsTap]);
  useEffect(() => {
    if (gate !== "leaving") return;
    const t = setTimeout(() => setGate("off"), 600);
    return () => clearTimeout(t);
  }, [gate]);
  useEffect(() => {
    if (gate === "off") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.setAttribute("data-sun-gate", "1");
    return () => {
      document.documentElement.style.overflow = prev;
      document.documentElement.removeAttribute("data-sun-gate");
    };
  }, [gate]);

  useEffect(() => {
    const el = dock.current;
    const slot = document.querySelector<HTMLElement>("[data-sun-slot]");
    const hero = document.querySelector<HTMLElement>('[data-sun-scene="hero"]');
    if (!el || !slot || !hero) return;

    const mobileMq = window.matchMedia("(max-width: 767px)");
    let heroProgress = alwaysMini ? 1 : 0;
    let k = alwaysMini ? 1 : 0; // smoothed hero → mini progress
    let spotName = "";
    let cx = NaN;
    let cy = NaN;
    let grow = 1;
    let growS = 1;
    let hopStart = -1;
    let hopFromY = 0;
    let lastHop = mascotState.hopId;
    let lastGo = mascotState.goId;
    let lastMode: "hero" | "mini" = "hero";
    let sizeW = 0;
    let sizeH = 0;
    let shown = false;
    let gP = gateRef.current === "on" ? 1 : 0; // blend: 1 = Sunny centred on the welcome screen
    let rise = reducedMotion ? 1 : 0; // sunrise reveal progress
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Hero → companion progress.
    const heroST = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom 35%",
      onUpdate: (self) => {
        heroProgress = alwaysMini ? 1 : self.progress;
      },
      onRefresh: (self) => {
        heroProgress = alwaysMini ? 1 : self.progress;
      },
    });

    // Scene triggers: set the active spot and cue acts once per entry.
    const sceneEls = Array.from(document.querySelectorAll<HTMLElement>("[data-sun-scene]")).filter((s) => s !== hero);
    const cueList = (list: string | undefined) => {
      timers.splice(0).forEach(clearTimeout);
      (list ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c, i) => {
          // later cues wait their turn (the director also queues behind locked acts)
          if (i === 0) cueSunny(c);
          else timers.push(setTimeout(() => cueSunny(c), i * 3400));
        });
    };
    const sceneSTs = sceneEls.map((scene) =>
      ScrollTrigger.create({
        trigger: scene,
        start: scene.dataset.sunStart ?? "top 60%",
        end: "bottom 60%",
        onEnter: () => {
          const d = scene.dataset;
          spotName = (mascotState.calm ? d.sunCalmSpot : d.sunEnterSpot) ?? d.sunScene ?? "";
          grow = Number(d.sunGrow ?? 1);
          cueList(mascotState.calm ? (d.sunCalmCue ?? d.sunCue) : d.sunCue);
          sunnyNarrate(d.sunScene ?? "");
        },
        onEnterBack: () => {
          const d = scene.dataset;
          spotName = d.sunScene ?? "";
          grow = Number(d.sunGrow ?? 1);
          cueList(d.sunCueBack);
          sunnyNarrate(d.sunScene ?? "");
        },
        onLeave: () => timers.splice(0).forEach(clearTimeout),
        onLeaveBack: () => timers.splice(0).forEach(clearTimeout),
      }),
    );
    ScrollTrigger.sort();

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = mobileMq.matches;

      // Dock size follows the hero slot (layout changes only → rare canvas resizes).
      const r = slot.getBoundingClientRect();
      if (Math.abs(r.width - sizeW) > 1 || Math.abs(r.height - sizeH) > 1) {
        sizeW = r.width;
        sizeH = r.height;
        el.style.width = `${sizeW}px`;
        el.style.height = `${sizeH}px`;
      }
      if (sizeW < 2) return;

      k = reducedMotion ? (heroProgress > 0.5 ? 1 : 0) : damp(k, heroProgress, 7, dt);
      const e = smoothstep(Math.min(1, Math.max(0, k)));

      const mode = e > 0.5 ? "mini" : "hero";
      if (mode !== lastMode) {
        lastMode = mode;
        mascotState.mode = mode;
        setMini(mode === "mini");
        if (mode === "hero") {
          cueSunny("hello");
          sunnyNarrate("hero");
        }
      }

      // Companion size and target position.
      growS = reducedMotion ? grow : damp(growS, grow, 3, dt);
      const miniW = (mobile ? 92 : Math.min(184, Math.max(140, vw * 0.11))) * growS;
      const sMini = miniW / sizeW;
      const boxW = sizeW * sMini;
      const boxH = sizeH * sMini;

      if (mascotState.goId !== lastGo) {
        lastGo = mascotState.goId;
        spotName = mascotState.goTo;
      }
      if (mascotState.hopId !== lastHop) {
        lastHop = mascotState.hopId;
        spotName = mascotState.hopTo;
        hopStart = now;
        hopFromY = cy;
      }

      let tx = vw - EDGE - boxW / 2;
      let ty = vh - EDGE - boxH / 2;
      if (!mobile && spotName) {
        const spot = document.querySelector<HTMLElement>(`[data-sun-spot="${spotName}"]`);
        const sr = spot?.getBoundingClientRect();
        // hidden spots (display: none at this breakpoint) report an empty rect
        if (spot && sr && (sr.width > 0 || sr.height > 0 || sr.left !== 0 || sr.top !== 0)) {
          tx = sr.left + sr.width / 2;
          ty = sr.top + sr.height / 2;
          // "right-edge": the dock's right edge sits on the spot (peek from behind it)
          if (spot.dataset.sunAlign === "right-edge") tx -= boxW / 2;
        }
      }
      tx = Math.min(vw - EDGE - boxW / 2, Math.max(EDGE + boxW / 2, tx));
      ty = Math.min(vh - EDGE - boxH / 2, Math.max(HEADER_H + boxH / 2, ty));

      if (Number.isNaN(cx)) {
        cx = tx;
        cy = ty;
      }
      const travel = reducedMotion ? 1 : 1 - Math.exp(-4.2 * dt);
      cx = lerp(cx, tx, travel);
      cy = lerp(cy, ty, travel);

      // Hop arc (surprise jump between spots).
      let arc = 0;
      if (hopStart > 0) {
        const u = (now - hopStart) / 900;
        if (u >= 1) hopStart = -1;
        else arc = -Math.sin(Math.PI * u) * Math.min(220, 80 + Math.abs(ty - hopFromY) * 0.4);
      }

      const left = lerp(r.left, cx - boxW / 2, e);
      const top = lerp(r.top, cy + arc * e - boxH / 2, e);
      const scale = lerp(1, sMini, e);
      let fl = left;
      let ft = top;
      let fs = scale;
      let fo = 1;
      gP = damp(gP, gateRef.current === "on" ? 1 : 0, gateRef.current === "on" ? 8 : 5, dt);
      if (gateRef.current === "on") rise = Math.min(1, rise + dt / 1.9);
      if (gP > 0.002) {
        const riseE = 1 - Math.pow(1 - rise, 3);
        const gSize = Math.min(vh * 0.44, vw * 0.8, 420);
        const gScale = Math.min(gSize / sizeW, gSize / sizeH);
        const gLeft = vw / 2 - (sizeW * gScale) / 2;
        const gTop = vh * 0.4 - (sizeH * gScale) / 2 + (1 - riseE) * vh * 0.4;
        fl = lerp(left, gLeft, gP);
        ft = lerp(top, gTop, gP);
        fs = lerp(scale, gScale, gP);
        fo = lerp(1, riseE, gP);
      }
      el.style.zIndex = gP > 0.002 ? "210" : "";
      el.style.opacity = fo < 0.999 ? fo.toFixed(3) : "";
      el.style.transform = `translate3d(${fl.toFixed(2)}px, ${ft.toFixed(2)}px, 0) scale(${fs.toFixed(4)})`;
      el.style.pointerEvents = e < 0.5 && gP < 0.002 ? "auto" : "none";
      if (!shown) {
        shown = true;
        el.style.visibility = "visible";
      }
    };
    gsap.ticker.add(tick);
    tick();

    return () => {
      gsap.ticker.remove(tick);
      heroST.kill();
      sceneSTs.forEach((st) => st.kill());
      timers.forEach(clearTimeout);
      mascotState.mode = "hero";
    };
  }, [reducedMotion]);

  return (
    <>
      <div
        ref={dock}
        className="fixed left-0 top-0 z-[60] origin-top-left will-change-transform"
        style={{ visibility: "hidden", width: 0, height: 0 }}
      >
        <MascotStage className="h-full w-full" />
      </div>

      {gate !== "off" && (
        <div
          className={`sun-gate fixed inset-0 z-[200] flex flex-col items-center justify-end overflow-hidden bg-ivory px-6 pb-[6vh] text-center transition-opacity duration-500 ${
            gate === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <style>{`
            @keyframes sg-glow{from{opacity:0;transform:translate(-50%,-30%) scale(.6)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
            @keyframes sg-rays{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}
            html[data-sun-gate] header{opacity:0!important;pointer-events:none!important}
            @keyframes sg-letter{from{opacity:0;transform:translateY(0.6em)}to{opacity:1;transform:none}}
            @keyframes sg-fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
            .sun-gate .sg-glow{animation:sg-glow 2.2s cubic-bezier(.2,.7,.2,1) both}
            .sun-gate .sg-rays{animation:sg-rays 40s linear infinite}
            .sun-gate .sg-letter{display:inline-block;animation:sg-letter .6s cubic-bezier(.2,.8,.2,1) both}
            .sun-gate .sg-fade{animation:sg-fade .7s ease both}
            @media (prefers-reduced-motion: reduce){.sun-gate *{animation:none!important}}
          `}</style>
          <div
            className="sg-glow pointer-events-none absolute left-1/2 top-[40%] h-[120vmin] w-[120vmin] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,197,51,0.55) 0%, rgba(255,160,40,0.22) 35%, rgba(255,253,245,0) 68%)" }}
            aria-hidden
          />
          <div
            className="sg-rays pointer-events-none absolute left-1/2 top-[40%] h-[150vmax] w-[150vmax] opacity-[0.16]"
            style={{
              background: "repeating-conic-gradient(from 0deg, rgba(255,184,0,0.9) 0deg 6deg, rgba(255,184,0,0) 6deg 18deg)",
              WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 38%)",
              maskImage: "radial-gradient(circle, #000 0%, transparent 38%)",
            }}
            aria-hidden
          />
          <p className="relative text-[clamp(2.4rem,7vw,4.2rem)] font-bold leading-none tracking-tight text-espresso" aria-label="BrightSun SEO">
            {"BrightSun".split("").map((c, i) => (
              <span key={i} className="sg-letter" style={{ animationDelay: `${1.5 + i * 0.06}s` }}>
                {c}
              </span>
            ))}
            {"SEO".split("").map((c, i) => (
              <span key={`s${i}`} className="sg-letter text-sun" style={{ animationDelay: `${2.05 + i * 0.07}s` }}>
                {c}
              </span>
            ))}
          </p>
          <p className="sg-fade relative mt-3 text-sm font-medium text-espresso/60" style={{ animationDelay: "2.5s" }}>
            Shine online.
          </p>
          <button
            type="button"
            autoFocus
            className="sg-fade relative mt-6 rounded-full bg-espresso px-8 py-4 text-base font-semibold text-ivory shadow-[0_18px_40px_-18px_rgba(35,27,24,0.7)] transition-transform hover:scale-105"
            style={{ animationDelay: "2.9s" }}
          >
            Meet Sunny 👋
          </button>
        </div>
      )}

      {/* Mute / unmute floats just above Sunny's head and follows him around */}
      {!silent && (
      <button
        ref={muteBtn}
        type="button"
        onClick={() => setMuted(!muted)}
        aria-pressed={muted}
        style={{ left: -999, top: -999 }}
        className="fixed z-[61] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-espresso px-3.5 py-1.5 text-xs font-semibold text-ivory shadow-[0_8px_24px_-14px_rgba(35,27,24,0.6)] transition-colors hover:bg-espresso/90"
      >
        {muted ? "🔊 Unmute Sunny" : "🔇 Mute Sunny"}
      </button>
      )}

      {/* Visitor controls: replay Sunny's line and calm mode. His voice is always on. */}
      <div className="fixed bottom-4 left-4 z-[60] flex max-w-[min(92vw,380px)] flex-col items-start gap-2">
        {needsTap && !silent && !caption && gate === "off" && (
          <p className="animate-pulse rounded-full bg-espresso px-4 py-2 text-xs font-semibold text-ivory shadow-[0_18px_40px_-18px_rgba(35,27,24,0.7)]">🔊 Click anywhere to hear Sunny say hi</p>
        )}
        {/* No speech-bubble text: Sunny only speaks. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={sunnyReplay}
            hidden={muted || silent}
            className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-espresso shadow-[0_8px_24px_-14px_rgba(35,27,24,0.45)] backdrop-blur transition hover:bg-white"
          >
            ↻ Say it again
          </button>
          {!reducedMotion && (
            <button
              type="button"
              onClick={toggleCalm}
              aria-pressed={calm}
              className={`rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-espresso shadow-[0_8px_24px_-14px_rgba(35,27,24,0.45)] backdrop-blur transition-opacity duration-500 hover:bg-white ${
                mini ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              tabIndex={mini ? 0 : -1}
            >
              {calm ? "Let Sunny play" : "Calm Sunny"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
