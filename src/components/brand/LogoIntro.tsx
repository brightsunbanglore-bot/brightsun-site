"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { MascotStage } from "@/components/mascot/MascotStage";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { SIT_Y, type Expression, type Pose, type Rig } from "@/components/mascot/sunnyPose";
import { createIntroSound, type IntroCue, type IntroSound } from "./logoIntroSound";

/**
 * BrightSun cinematic logo intro — uses ONLY the existing 3D Sunny (scripted through
 * MascotStage's `rig` prop on a locked camera). One Sunny, no new character.
 *
 * Storyboard (named beats in BEAT, ~8 s):
 *   letters  "rightSun" settles in; the space for "B" stays empty
 *   enter    Sunny (smaller than the letters) walks in from the left, leaning in, both hands on a heavy "B"
 *   impact   "B" lands with weight (stays aligned); a ripple runs through the word and the last "n" tips over
 *   notice   Sunny stops, double-take, hands to his face
 *   scamper  he runs along the word to the "n"
 *   fix      pushes the "n" upright; it settles with a soft bounce; satisfied nod
 *   back     runs back to the "B"
 *   climb    jumps, grabs the top edge, legs scramble, pulls himself up
 *   sit      turns round and sits on the top edge of the "B", legs dangling
 *   proud    the word settles, smile, shades on, cheerful sting, hold
 *
 * Sound is OFF by default; the visitor turns it on with the Sound button (a user gesture).
 * Skip button, reduced-motion fallback (final frame only) and responsive layout included.
 */

const WORD = "BrightSun";
const NB = 6; // "Bright" espresso, "Sun" gold
const LETTERS = WORD.split("");
const N_IDX = LETTERS.length - 1; // the lowercase "n" that tips over
const TAGLINE = "Grow Brighter Online";

/** Scene beats (seconds at speed 1) — tweak timing here. */
export const BEAT = {
  letters: 0,
  enter: 0.7,
  impact: 2.6,
  notice: 2.95,
  scamper: 4.0,
  fix: 6.1,
  back: 7.7,
  climb: 10.6,
  sit: 12.85,
  proud: 13.1,
  end: 14.5,
};

// Locked camera maths (MascotScene `fixedCamera`): fov 28° at distance 9.2.
const VIEW_H = 2 * 9.2 * Math.tan((14 * Math.PI) / 180);
const FEET = 1.56; // feet below the stage's centre line (world units)
const CONTACT = 1.25; // pushing hands reach this far in front of Sunny's centre (world units)
const HAND_H = 1.4; // pushing hands are this high above the ground (world units)
const SUNNY_H = 3.3; // Sunny's standing height (world units)
const N_TILT = 11; // degrees

type Layout = {
  vw: number;
  vh: number;
  P: number;
  fs: number;
  baseY: number;
  X0: number;
  WW: number;
  widths: number[];
  fx: number[];
  asc: number;
  cap: number;
  stageTop: number;
  stageH: number;
  stageW: number;
};

function computeLayout(vw: number, vh: number, em: number[], ascEm: number, capEm: number): Layout {
  const sumEm = em.reduce((a, b) => a + b, 0);
  // Sunny at the scroll-companion's miniature size (SunnyCompanion: 92 px on phones, 140–184 px wide on desktop).
  const miniW = vw < 768 ? 92 : Math.min(184, Math.max(140, vw * 0.11));
  const P = (miniW * 0.7) / SUNNY_H;
  // letters sized on their own: as big as fits, leaving room for Sunny on both sides
  const fs = Math.min((vw - 8 * P - 32) / sumEm, vh * 0.26, 230);
  const widths = em.map((e) => e * fs);
  const WW = sumEm * fs;
  const X0 = vw / 2 - WW / 2;
  const fx: number[] = [];
  let x = X0;
  widths.forEach((w) => {
    fx.push(x);
    x += w;
  });
  const baseY = vh * 0.6;
  const stageH = VIEW_H * P;
  return { vw, vh, P, fs, baseY, X0, WW, widths, fx, asc: ascEm * fs, cap: capEm * fs, stageTop: baseY - FEET * P - stageH / 2, stageH, stageW: stageH * 1.6 };
}

type Letter = { el: HTMLSpanElement; fx: number; ex: number; y: number; r: number; sx: number; sy: number; op: number };
type Scene = { L: Letter[]; S: { uB: number; lift: number; behind: number }; DB: number; render: () => void };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;

type Props = {
  /** Fires at the end of the final hold, or when the visitor skips. */
  onComplete?: () => void;
  /** If given, the Skip button calls this (e.g. to go straight to the site) instead of jumping to the last frame. */
  onSkip?: () => void;
  speed?: number;
  /** Fades in under the logo at the end (e.g. a "Meet Sunny" button). */
  cta?: ReactNode;
  /** Show the Skip / Sound controls (default true). */
  controls?: boolean;
  /** Sound starts on (default). Browsers only allow audio once the visitor has interacted
   *  with the page, so where it's blocked it switches on at the first click / tap / key. */
  soundDefault?: boolean;
  fullscreen?: boolean;
  className?: string;
};

export function LogoIntro({ onComplete, onSkip, speed = 1, cta, controls = true, soundDefault = true, fullscreen = true, className = "" }: Props) {
  const reduced = usePrefersReducedMotion();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [run, setRun] = useState(0);
  const [ctaOn, setCtaOn] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [finished, setFinished] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const userMuted = useRef(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLDivElement>(null);
  const letterEls = useRef<(HTMLSpanElement | null)[]>([]);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const measured = useRef<{ em: number[]; ascEm: number; capEm: number } | null>(null);
  const layoutRef = useRef<Layout | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const rigApi = useRef<{ pose: Pose; setExpr: (e: Expression) => void } | null>(null);
  const started = useRef(false);
  const doneRef = useRef(false);
  const soundRef = useRef<IntroSound | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const sfx = (name: IntroCue, i?: number) => soundRef.current?.cue(name, i);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFinished(true);
    setCtaOn(true);
    onCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    document.documentElement.setAttribute("data-sun-gate", "1");
    return () => document.documentElement.removeAttribute("data-sun-gate");
  }, [fullscreen]);

  useEffect(() => () => soundRef.current?.stop(), []);

  // Sound on from the start: try right away; if the browser blocks it, the first gesture unlocks it.
  useEffect(() => {
    if (!soundDefault || reduced) return;
    const s = (soundRef.current ??= createIntroSound());
    let alive = true;
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const remove = () => events.forEach((e) => window.removeEventListener(e, onGesture, true));
    const enable = async () => {
      const ok = await s.unlock();
      if (!alive || !ok || userMuted.current) return;
      remove();
      setSoundOn(true);
      setSoundBlocked(false);
      const t = tlRef.current?.time() ?? 0;
      if (t > BEAT.enter && t < BEAT.impact) s.cue("enter"); // joined mid-push: start the music bed
    };
    function onGesture() {
      void enable();
    }
    events.forEach((e) => window.addEventListener(e, onGesture, true));
    void enable();
    // if nothing happened shortly, the browser is waiting for a gesture
    const hint = setTimeout(() => alive && !s.ready() && !userMuted.current && setSoundBlocked(true), 600);
    return () => {
      alive = false;
      clearTimeout(hint);
      remove();
    };
  }, [soundDefault, reduced]);

  // ---- measure letters (fonts ready) → layout; re-layout + restart on resize ----
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => {
      const m = measured.current;
      const root = rootRef.current;
      if (!m || !root) return;
      const r = root.getBoundingClientRect();
      const l = computeLayout(r.width, r.height, m.em, m.ascEm, m.capEm);
      layoutRef.current = l;
      setLayout(l);
    };
    const measure = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        /* measure anyway */
      }
      if (cancelled) return;
      const els = letterEls.current.filter(Boolean) as HTMLSpanElement[];
      if (els.length !== LETTERS.length) return;
      const em = els.map((el) => el.getBoundingClientRect().width / 100);
      const marker = els[0].querySelector("i");
      const ascEm = marker ? (marker.getBoundingClientRect().bottom - els[0].getBoundingClientRect().top) / 100 : 0.8;
      let capEm = 0.72;
      try {
        const c = document.createElement("canvas").getContext("2d");
        if (c) {
          const cs = getComputedStyle(els[0]);
          c.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
          const a = c.measureText("B").actualBoundingBoxAscent;
          if (a > 30 && a < 100) capEm = a / 100;
        }
      } catch {
        /* default */
      }
      measured.current = { em, ascEm, capEm };
      apply();
    };
    void measure();
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (doneRef.current) {
          apply(); // finished: just re-lay out the final frame
          return;
        }
        apply();
        started.current = false;
        setCtaOn(false);
        soundRef.current?.stop();
        setRun((k) => k + 1);
      }, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ---- letter state + render loop ----
  useEffect(() => {
    const lay = layout;
    if (!lay) return;
    const els = letterEls.current.filter(Boolean) as HTMLSpanElement[];
    const tag = tagRef.current;
    const L: Letter[] = els.map((el, i) => ({ el, fx: lay.fx[i], ex: 0, y: 0, r: 0, sx: 1, sy: 1, op: 0 }));
    const S = { uB: 0, lift: 0, behind: 0 };
    const DB = lay.fx[0] + lay.widths[0] * 0.55; // "B" starts half off-screen at the left edge
    L.forEach((l, i) => {
      l.el.style.top = `${lay.baseY - lay.asc}px`;
      // the "n" tips over its bottom-right corner; the others bounce from their baseline centre
      l.el.style.transformOrigin = i === N_IDX ? `${lay.widths[i]}px ${lay.asc}px` : `${lay.widths[i] / 2}px ${lay.asc}px`;
    });
    const render = () => {
      L.forEach((l, i) => {
        const off = i === 0 ? -(1 - S.uB) * DB : 0;
        l.el.style.transform = `translate3d(${(l.fx + off + l.ex).toFixed(2)}px, ${l.y.toFixed(2)}px, 0) rotate(${l.r.toFixed(2)}deg) scale(${l.sx.toFixed(3)}, ${l.sy.toFixed(3)})`;
        l.el.style.opacity = String(l.op);
      });
      // Sunny's own small canvas travels with him (camera always straight in front: no distortion)
      const sx = rigApi.current ? lay.vw / 2 + rigApi.current.pose.x * lay.P - lay.stageW / 2 : -lay.stageW * 2;
      if (stageRef.current) stageRef.current.style.transform = `translate3d(${sx.toFixed(2)}px, ${(-S.lift).toFixed(2)}px, 0)`;
      // behind = 1: the word is drawn over Sunny (he's walking / climbing behind the letters)
      if (lettersRef.current) lettersRef.current.style.zIndex = S.behind > 0.5 ? "3" : "1";
    };
    gsap.ticker.add(render);
    sceneRef.current = { L, S, DB, render };

    const showFinalLetters = () => {
      S.uB = 1;
      S.lift = lay.cap;
      L.forEach((l) => Object.assign(l, { op: 1, ex: 0, y: 0, r: 0, sx: 1, sy: 1 }));
      if (tag) gsap.set(tag, { opacity: 1, y: 0, letterSpacing: "0.34em" });
      render();
    };
    if (reduced || doneRef.current) {
      showFinalLetters();
      if (reduced) finish();
    } else render();

    // No WebGL / slow device: assemble the wordmark without Sunny.
    const fallback = setTimeout(() => {
      if (started.current || reduced || doneRef.current) return;
      started.current = true;
      S.lift = 0;
      const tl = gsap.timeline({ onComplete: finish });
      tlRef.current = tl;
      tl.to(L.slice(1), { op: 1, duration: 0.5, stagger: 0.08 }, 0)
        .set(L[0], { op: 1 }, 0.9)
        .to(S, { uB: 1, duration: 1.1, ease: "power3.out" }, 0.9);
      if (tag) tl.fromTo(tag, { opacity: 0, y: 14, letterSpacing: "0.55em" }, { opacity: 1, y: 0, letterSpacing: "0.34em", duration: 1.1, ease: "power3.out" }, 2.0);
    }, 6000);

    return () => {
      clearTimeout(fallback);
      gsap.ticker.remove(render);
      sceneRef.current = null;
      if (tag) gsap.set(tag, { opacity: 0 });
    };
  }, [layout, run, reduced, finish]);

  // ---- the performance ----
  const perform: Rig = useCallback(
    ({ pose, setExpr }) => {
      const sc = sceneRef.current;
      const lay = layoutRef.current;
      const tag = tagRef.current;
      if (!sc || !lay) return;
      rigApi.current = { pose, setExpr };
      const { L, S, DB } = sc;
      const { P, vw } = lay;
      const cx = vw / 2;
      const wx = (px: number) => (px - cx) / P;
      const B = L[0];
      const n = L[N_IDX];
      const bLeft = lay.fx[0];
      const bMid = bLeft + lay.widths[0] / 2;
      const nRight = lay.fx[N_IDX] + lay.widths[N_IDX];

      // The camera sits at x = 0, so "facing us" for a Sunny standing at x means turning toward
      // the lens (otherwise perspective makes him look away). dir: +1 = profile right, -1 = left.
      const faceCam = (x: number) => 0 * x; // the camera is always straight in front of Sunny now
      const facing = (x: number, dir: number, amt = 1.15) => faceCam(x) + dir * amt;
      // Heavy shove: progress comes in surges (heaves) instead of a smooth glide.
      const heaves = (k: number, depth = 0.85) => (p: number) => p - (Math.sin(2 * Math.PI * k * p) / (2 * Math.PI * k)) * depth;
      const heavePhase = (k: number, p: number) => (1 - Math.cos(2 * Math.PI * k * p)) / 2; // 0 at rest, 1 mid-shove

      // Sunny's x for each beat (world units). Hands reach CONTACT in front of his centre.
      const xPush0 = wx(bLeft - DB) - CONTACT;
      const xPush1 = wx(bLeft) - CONTACT;
      const nHandX = (deg: number) => wx(nRight) + HAND_H * Math.tan(rad(deg)); // n's right edge at hand height
      const xFix0 = nHandX(N_TILT) + CONTACT;
      const xSit = wx(bMid);

      const armsPush = { fwd: 1.45, raise: -0.25, bend: 0.2, grip: 0.1 };
      const armsHigh = { fwd: 1.9, raise: -0.15, bend: 0.2, grip: 0.1 }; // reaching up the tall "n"
      const armsRest = { fwd: 0, raise: 0, bend: 0.3, grip: 0.35 };
            const sitLegs = { hip: -1.5, knee: 1.25 }; // thighs on the top edge, shins hanging over the front
      const sitArms = { fwd: 0.35, raise: 0.4, bend: 0.25, grip: 0.4 }; // hands resting on the edge

      const finalPose = () => {
        pose.x = xSit;
        pose.y = SIT_Y;
        pose.turn = faceCam(xSit);
        pose.tilt = 0;
        pose.walk = 0;
        pose.run = 0;
        pose.shades = 1;
        Object.assign(pose.legL, sitLegs);
        Object.assign(pose.legR, sitLegs);
        Object.assign(pose.armL, sitArms);
        Object.assign(pose.armR, sitArms);
        setExpr("normal");
      };
      if (reduced || doneRef.current) {
        S.lift = lay.cap;
        finalPose();
        return;
      }
      started.current = true;

      const tl = gsap.timeline({
        onComplete: () => {
          soundRef.current?.stop();
          finish();
        },
      });
      tlRef.current = tl;
      tl.timeScale(speed);
      Object.entries(BEAT).forEach(([k, v]) => tl.addLabel(k, v));

      // ---------- start: off-screen left, shades up (his eyes do the acting) ----------
      tl.set(pose, { x: xPush0, y: 0, turn: facing(xPush0, 1), tilt: -0.22, walk: 0, run: 0, shades: 0 }, 0)
        .set(pose.armL, armsPush, 0)
        .set(pose.armR, armsPush, 0)
        .set(S, { uB: 0, lift: 0, behind: 0 }, 0);

      // ---------- letters: "rightSun", the B's place left empty ----------
      for (let i = 1; i < L.length; i++) {
        const at = BEAT.letters + 0.1 + (i - 1) * 0.07;
        tl.fromTo(L[i], { op: 0, y: 28 }, { op: 1, y: 0, duration: 0.6, ease: "power3.out" }, at).call(() => sfx("letter", i - 1), [], at);
      }

      // ---------- enter: three heavy shoves, leaning into the B with both hands ----------
      const PUSH = BEAT.impact - BEAT.enter;
      const pushProg = { p: 0 };
      const pushEase = heaves(3);
      tl.set(B, { op: 1 }, "enter")
        .set(pose, { walk: 1 }, "enter")
        .call(() => setExpr("effort"), [], "enter")
        .call(() => sfx("enter"), [], "enter")
        .call(() => sfx("push"), [], BEAT.enter + 0.1)
        .to(
          pushProg,
          {
            p: 1,
            duration: PUSH,
            ease: "none",
            onUpdate: () => {
              const pp = pushProg.p;
              const h = heavePhase(3, pp);
              S.uB = pushEase(pp);
              pose.x = lerp(xPush0, xPush1, S.uB);
              pose.turn = facing(pose.x, 1);
              pose.tilt = -0.18 - 0.1 * h; // leans in harder on each shove
              pose.squash = 1 - 0.05 * h; // sinks into the push
              pose.armL.bend = pose.armR.bend = 0.2 + 0.25 * (1 - h); // elbows give between shoves
              B.r = 1.2 * h * Math.sin(2 * Math.PI * 3 * pp); // the block rocks forward on each shove
              B.y = -2.5 * h;
            },
          },
          "enter",
        );

      // ---------- impact: B lands with weight, Sunny stumbles, ripple, the "n" tips ----------
      tl.to(B, { r: 0, y: 0, sy: 0.95, sx: 1.03, duration: 0.07, ease: "power2.out" }, "impact")
        .to(B, { sy: 1, sx: 1, duration: 0.5, ease: "elastic.out(1,0.5)" }, BEAT.impact + 0.07)
        .call(() => sfx("land"), [], "impact")
        .to(pose, { walk: 0, tilt: -0.34, squash: 0.9, duration: 0.08 }, "impact") // momentum carries him into it
        .to(pose, { tilt: -0.05, squash: 1, duration: 0.45, ease: "elastic.out(1,0.45)" }, BEAT.impact + 0.08);
      for (let i = 1; i < N_IDX; i++) {
        const at = BEAT.impact + 0.02 + i * 0.03;
        tl.to(L[i], { y: -7, duration: 0.09, ease: "power2.out" }, at).to(L[i], { y: 0, duration: 0.35, ease: "bounce.out" }, at + 0.09);
      }
      const tTip = BEAT.impact + 0.02 + N_IDX * 0.03;
      tl.to(n, { y: -9, duration: 0.09, ease: "power2.out" }, tTip)
        .to(n, { y: 0, r: N_TILT, duration: 0.32, ease: "back.out(2.2)" }, tTip + 0.09)
        .call(() => sfx("tilt"), [], tTip + 0.1);

      // ---------- notice: looks along the word, double-take, hands to cheeks ----------
      const xN = xPush1;
      tl.to(pose.armL, { ...armsRest, duration: 0.3 }, "notice")
        .to(pose.armR, { ...armsRest, duration: 0.3 }, "notice")
        .to(pose, { tilt: 0, turn: facing(xN, 1, 0.9), duration: 0.3, ease: "power2.inOut" }, "notice") // looks down the word…
        .call(() => setExpr("surprised"), [], BEAT.notice + 0.25)
        .call(() => sfx("notice"), [], BEAT.notice + 0.25)
        .to(pose, { y: 0.22, squash: 1.08, duration: 0.14, ease: "power2.out" }, BEAT.notice + 0.25)
        .to(pose, { y: 0, squash: 1, duration: 0.16, ease: "power2.in" }, BEAT.notice + 0.39)
        .to(pose, { turn: faceCam(xN), duration: 0.14 }, BEAT.notice + 0.58) // …to us…
        .to(pose, { turn: facing(xN, 1, 0.9), duration: 0.12 }, BEAT.notice + 0.74) // …at the n…
        .to(pose, { turn: faceCam(xN), duration: 0.12 }, BEAT.notice + 0.88) // …to us again
        .call(() => sfx("funny"), [], BEAT.notice + 0.88)
        .to(pose.armL, { raise: 2.0, fwd: 0.5, bend: 2.1, grip: 0, duration: 0.18, ease: "back.out(2)" }, BEAT.notice + 0.88)
        .to(pose.armR, { raise: 2.0, fwd: 0.5, bend: 2.1, grip: 0, duration: 0.18, ease: "back.out(2)" }, BEAT.notice + 0.88)
        .to(pose, { squash: 0.94, tilt: 0.06, duration: 0.18 }, BEAT.notice + 0.88)
        .to(pose, { squash: 1, tilt: 0, duration: 0.2 }, BEAT.notice + 1.08)
        .to(pose.armL, { ...armsRest, duration: 0.2 }, BEAT.scamper - 0.1)
        .to(pose.armR, { ...armsRest, duration: 0.2 }, BEAT.scamper - 0.1);

      // ---------- scamper: run along the word, past the "n" ----------
      const run1 = { p: 0 };
      const xR0 = xN;
      const xR1 = xFix0 + 0.55;
      tl.call(() => setExpr("normal"), [], "scamper")
        .call(() => sfx("scamper"), [], "scamper")
        .to(pose, { run: 1, duration: 0.15 }, "scamper")
        .to(
          run1,
          {
            p: 1,
            duration: BEAT.fix - BEAT.scamper - 0.1,
            ease: "power2.inOut",
            onUpdate: () => {
              pose.x = lerp(xR0, xR1, run1.p);
              pose.turn = facing(pose.x, 1, 1.3);
            },
          },
          "scamper",
        )
        .to(pose, { run: 0, duration: 0.15 }, BEAT.fix - 0.2);

      // ---------- fix: turn, plant, two heaves push the "n" upright ----------
      const F = BEAT.fix;
      const fixT = { p: 0 };
      const fixEase = heaves(2, 0.7);
      tl.to(pose, { turn: facing(xR1, -1), duration: 0.22, ease: "power2.inOut" }, F)
        .call(() => setExpr("effort"), [], F + 0.15)
        .to(pose.armL, { ...armsHigh, duration: 0.22 }, F + 0.1)
        .to(pose.armR, { ...armsHigh, duration: 0.22 }, F + 0.1)
        .to(pose, { x: xFix0, walk: 0.6, tilt: 0.22, squash: 0.93, duration: 0.22, ease: "power2.out" }, F + 0.15) // steps in, hands on the letter
        .to(pose, { walk: 0, duration: 0.1 }, F + 0.37)
        .to(
          fixT,
          {
            p: 1,
            duration: 0.75,
            ease: "none",
            onUpdate: () => {
              const h = heavePhase(2, fixT.p);
              const r = N_TILT * (1 - fixEase(fixT.p));
              n.r = r;
              pose.x = nHandX(r) + CONTACT; // hands stay on the letter as it rights itself
              pose.turn = facing(pose.x, -1);
              pose.tilt = 0.2 + 0.1 * h;
              pose.squash = 0.95 - 0.04 * h;
            },
          },
          F + 0.38,
        )
        .call(() => sfx("fix"), [], F + 1.1)
        .to(n, { sy: 0.95, duration: 0.07 }, F + 1.13)
        .to(n, { sy: 1, duration: 0.55, ease: "elastic.out(1,0.45)" }, F + 1.2)
        .to(pose.armL, { ...armsRest, duration: 0.25 }, F + 1.15)
        .to(pose.armR, { ...armsRest, duration: 0.25 }, F + 1.15)
        .call(() => setExpr("normal"), [], F + 1.15)
        .to(pose, { x: xFix0 + 0.3, squash: 1, tilt: 0, turn: faceCam(xFix0), duration: 0.3, ease: "power2.out" }, F + 1.15) // steps back, admires it
        .to(pose, { tilt: 0.08, duration: 0.1, yoyo: true, repeat: 1 }, F + 1.35); // satisfied nod

      // ---------- back: jogs back BEHIND the word (seen through the gaps, past the "h") ----------
      const run2 = { p: 0 };
      const xB0 = xFix0 + 0.3;
      tl.set(S, { behind: 1 }, "back")
        .call(() => sfx("scamper"), [], BEAT.back + 0.3)
        .to(pose, { walk: 0.35, run: 0.7, duration: 0.25 }, "back")
        .to(
          run2,
          {
            p: 1,
            duration: BEAT.climb - BEAT.back - 0.1,
            ease: "sine.inOut",
            onUpdate: () => {
              pose.x = lerp(xB0, xSit, run2.p);
              pose.turn = facing(pose.x, -1, 1.35);
            },
          },
          "back",
        )
        .to(pose, { walk: 0, run: 0, duration: 0.2 }, BEAT.climb - 0.2);

      // ---------- climb: up the back of the "B", facing us — like a person climbing over a wall ----------
      // He faces the letter (and so the camera): his hands grip the top edge, his face rises over it,
      // then a leg swings over toward us before he settles on top. Weighted and unhurried, no bounces.
      const C = BEAT.climb;
      const hang = lay.cap - 2.2 * P; // arms up: hands on the top edge
      tl.call(() => setExpr("effort"), [], C)
        .to(pose, { turn: faceCam(xSit), tilt: 0, duration: 0.3, ease: "power2.inOut" }, C) // faces the letter / us
        .to(pose, { squash: 0.86, duration: 0.25, ease: "power2.out" }, C + 0.2) // bends the knees
        .to(pose.armL, { fwd: -0.4, raise: 0.1, bend: 0.4, duration: 0.25 }, C + 0.2)
        .to(pose.armR, { fwd: -0.4, raise: 0.1, bend: 0.4, duration: 0.25 }, C + 0.2)
        .call(() => sfx("climb"), [], C + 0.48)
        .to(pose, { squash: 1.05, duration: 0.15, ease: "power2.out" }, C + 0.48) // jumps to reach the edge
        .to(pose.armL, { fwd: 0, raise: 2.6, bend: 0.05, grip: 0.9, duration: 0.2 }, C + 0.48)
        .to(pose.armR, { fwd: 0, raise: 2.6, bend: 0.05, grip: 0.9, duration: 0.2 }, C + 0.48)
        .to(S, { lift: hang, duration: 0.3, ease: "power2.out" }, C + 0.48) // hands catch the top edge
        .to(pose, { squash: 1, duration: 0.2 }, C + 0.63)
        // hanging: feet find the back of the letter
        .to(pose.legL, { hip: 0.35, knee: 0.9, duration: 0.25, ease: "sine.inOut" }, C + 0.8)
        .to(pose.legR, { hip: 0.15, knee: 0.5, duration: 0.25, ease: "sine.inOut" }, C + 0.9)
        // pull-up: elbows bend, face comes up over the edge (slow, heavy)
        .to(pose.armL, { raise: 2.05, bend: 1.75, duration: 0.55, ease: "power2.inOut" }, C + 1.05)
        .to(pose.armR, { raise: 2.05, bend: 1.75, duration: 0.55, ease: "power2.inOut" }, C + 1.05)
        .to(S, { lift: lay.cap - 0.9 * P, duration: 0.55, ease: "power2.inOut" }, C + 1.05)
        .to(pose, { squash: 0.96, duration: 0.55 }, C + 1.05)
        // presses down on the edge, one leg swings up and over toward us, then the other
        .to(pose.armL, { raise: 0.7, fwd: 0.45, bend: 0.25, duration: 0.35, ease: "power2.inOut" }, C + 1.6)
        .to(pose.armR, { raise: 0.7, fwd: 0.45, bend: 0.25, duration: 0.35, ease: "power2.inOut" }, C + 1.6)
        .to(S, { lift: lay.cap + 0.2 * P, duration: 0.4, ease: "power2.inOut" }, C + 1.6)
        .to(pose, { squash: 1, tilt: -0.08, duration: 0.4 }, C + 1.6)
        .to(pose.legL, { hip: -1.7, knee: 1.5, duration: 0.35, ease: "power2.inOut" }, C + 1.75)
        .set(S, { behind: 0 }, C + 1.95) // body above the letter now: draw him in front
        .to(pose.legR, { hip: -1.2, knee: 1.2, duration: 0.3, ease: "power2.inOut" }, C + 1.95);

      // ---------- sit: shuffle to the middle, turn to face us, settle on the top edge ----------
      tl.to(pose, { x: xSit, tilt: 0, turn: faceCam(xSit), duration: 0.3, ease: "power2.inOut" }, "sit-=0.1")
        .to(pose, { y: SIT_Y, duration: 0.25, ease: "power2.in" }, "sit")
        .to(S, { lift: lay.cap, duration: 0.25, ease: "power2.in" }, "sit")
        .to(pose.legL, { ...sitLegs, duration: 0.3 }, "sit")
        .to(pose.legR, { ...sitLegs, duration: 0.3 }, "sit")
        .to(pose.armL, { ...sitArms, duration: 0.3 }, "sit")
        .to(pose.armR, { ...sitArms, duration: 0.3 }, "sit")
        .call(() => setExpr("normal"), [], BEAT.sit + 0.1)
        .call(() => sfx("sit"), [], BEAT.sit + 0.25)
        .to(pose, { squash: 0.93, duration: 0.1 }, BEAT.sit + 0.25)
        .to(pose, { squash: 1, duration: 0.4, ease: "power2.out" }, BEAT.sit + 0.35)
        .to(B, { sy: 0.97, duration: 0.07 }, BEAT.sit + 0.25)
        .to(B, { sy: 1, duration: 0.5, ease: "elastic.out(1,0.45)" }, BEAT.sit + 0.32);

      // ---------- proud: settle, sting, shades on, hold ----------
      tl.call(() => sfx("sting"), [], "proud")
        .to(pose.armR, { raise: 2.3, fwd: 0, bend: 0.3, grip: 0, duration: 0.3, ease: "back.out(2)" }, BEAT.proud + 0.1)
        .to(pose, { shades: 1, duration: 0.5, ease: "bounce.out" }, BEAT.proud + 0.35)
        .to(pose.armR, { ...sitArms, duration: 0.4 }, BEAT.proud + 0.9)
        .to(pose.legL, { hip: -1.75, knee: 0.9, duration: 0.34, ease: "sine.inOut", yoyo: true, repeat: 3 }, BEAT.proud + 0.4)
        .to(pose.legR, { hip: -1.25, knee: 1.5, duration: 0.34, ease: "sine.inOut", yoyo: true, repeat: 3 }, BEAT.proud + 0.4);
      for (let i = 1; i < L.length; i++) {
        const at = BEAT.proud + 0.05 + (i - 1) * 0.04;
        tl.to(L[i], { y: -8, sy: 1.03, duration: 0.15, ease: "power2.out" }, at).to(L[i], { y: 0, sy: 1, duration: 0.8, ease: "elastic.out(1,0.5)" }, at + 0.15);
      }
      if (tag) tl.fromTo(tag, { opacity: 0, y: 16, letterSpacing: "0.55em" }, { opacity: 1, y: 0, letterSpacing: "0.34em", duration: 1.1, ease: "power3.out" }, BEAT.proud + 0.35);
      tl.call(() => setCtaOn(true), [], BEAT.proud + 1.0);
      tl.to({}, { duration: 0.01 }, BEAT.end);

      return () => {
        tl.kill();
        if (tlRef.current === tl) tlRef.current = null;
        started.current = false;
        rigApi.current = null;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced, speed, finish],
  );

  // The 3D character can mount a moment before the scene exists: wait for it.
  const rig: Rig = useCallback(
    (api) => {
      if (sceneRef.current && layoutRef.current) return perform(api);
      let inner: void | (() => void);
      const id = setInterval(() => {
        if (sceneRef.current && layoutRef.current) {
          clearInterval(id);
          inner = perform(api);
        }
      }, 30);
      return () => {
        clearInterval(id);
        inner?.();
      };
    },
    [perform],
  );

  // ---- controls ----
  const skip = () => {
    soundRef.current?.stop();
    if (onSkip) {
      onSkip();
      return;
    }
    const tl = tlRef.current;
    if (tl) tl.progress(1, true); // jump to the final frame without firing the beat callbacks
    const sc = sceneRef.current;
    const lay = layoutRef.current;
    if (sc && lay) {
      sc.S.uB = 1;
      sc.S.lift = rigApi.current ? lay.cap : 0;
      sc.L.forEach((l) => Object.assign(l, { op: 1, ex: 0, y: 0, r: 0, sx: 1, sy: 1 }));
      sc.render();
    }
    if (tagRef.current) gsap.set(tagRef.current, { opacity: 1, y: 0, letterSpacing: "0.34em" });
    rigApi.current?.setExpr("normal");
    finish();
  };

  const toggleSound = async () => {
    if (soundOn) {
      userMuted.current = true;
      soundRef.current?.setMuted(true);
      setSoundOn(false);
      return;
    }
    userMuted.current = false;
    soundRef.current ??= createIntroSound();
    const ok = await soundRef.current.unlock(); // user gesture → allowed to play
    setSoundOn(ok);
    setSoundBlocked(false);
  };

  return (
    <div
      ref={rootRef}
      className={`${fullscreen ? "fixed inset-0 z-[200]" : "relative h-full w-full"} overflow-hidden bg-ivory ${className}`}
      style={{ ["--fs" as string]: `${layout ? layout.fs : 100}px` }}
    >
      <style>{`html[data-sun-gate] header{opacity:0!important;pointer-events:none!important}`}</style>
      <h1 className="sr-only">BrightSun — {TAGLINE}</h1>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% 55%, rgba(255,194,51,0.13) 0%, rgba(255,243,220,0.5) 45%, rgba(255,253,247,0) 75%)" }}
      />

      <div ref={lettersRef} aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
        {LETTERS.map((c, i) => (
          <span
            key={`${run}-${i}`}
            ref={(el) => void (letterEls.current[i] = el)}
            className={`absolute left-0 block whitespace-pre font-hero font-extrabold leading-none tracking-[-0.045em] will-change-transform ${i < NB ? "text-espresso" : "text-sun"}`}
            style={{ fontSize: "var(--fs)", opacity: 0 }}
          >
            {c}
            <i style={{ display: "inline-block", width: 0, height: 0 }} />
          </span>
        ))}
      </div>

      <p
        ref={tagRef}
        aria-hidden
        className="pointer-events-none absolute left-0 w-full text-center text-[clamp(0.7rem,1.5vw,1.05rem)] font-semibold uppercase text-espresso/60"
        style={{ opacity: 0, top: layout ? layout.baseY + layout.fs * 0.3 : "70%", letterSpacing: "0.34em" }}
      >
        {TAGLINE}
      </p>

      {layout && (
        <div
          ref={stageRef}
          aria-hidden
          className="pointer-events-none absolute left-0 will-change-transform"
          style={{ top: layout.stageTop, width: layout.stageW, height: layout.stageH, zIndex: 2 }}
        >
          <MascotStage key={run} rig={rig} fixedCamera noFallback className="!rounded-none h-full w-full" />
        </div>
      )}

      {controls && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {!reduced && soundBlocked && !soundOn && (
            <span className="animate-pulse rounded-full bg-espresso px-3 py-2 text-xs font-semibold text-ivory">Tap anywhere for sound</span>
          )}
          {!reduced && (
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Mute intro sound" : "Turn on intro sound"}
              className="rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-espresso shadow-[0_8px_24px_-14px_rgba(35,27,24,0.45)] backdrop-blur transition hover:bg-white"
            >
              {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
            </button>
          )}
          {!finished && !reduced && (
            <button
              type="button"
              onClick={skip}
              className="rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-espresso shadow-[0_8px_24px_-14px_rgba(35,27,24,0.45)] backdrop-blur transition hover:bg-white"
            >
              Skip intro →
            </button>
          )}
        </div>
      )}

      {cta && (
        <div
          className={`absolute inset-x-0 flex justify-center transition-all duration-700 ${ctaOn ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
          style={{ top: layout ? layout.baseY + layout.fs * 0.3 + 64 : "78%" }}
        >
          {cta}
        </div>
      )}
    </div>
  );
}
