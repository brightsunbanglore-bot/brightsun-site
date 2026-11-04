"use client";

/**
 * Header logo: the BrightSun lettering from the intro (Bricolage Grotesque ExtraBold, espresso + sun)
 * with the same 3D Sunny living on it. He sleeps on top of the "B" with his legs swinging, wakes up,
 * does something silly, jumps down, wanders along *behind* the letters, climbs back up and dozes off
 * again — on a loop. Reduced motion: a still, sleeping Sunny. No WebGL: just the wordmark.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { MascotStage } from "@/components/mascot/MascotStage";
import { BALL_Y, SIT_Y, type Pose, type Rig, type RigApi } from "@/components/mascot/sunnyPose";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { siteConfig } from "@/data/site";

const VIEW_H = 2 * 9.2 * Math.tan((14 * Math.PI) / 180); // locked camera of the scripted Sunny
const FEET = 1.56; // feet below the stage centre line (world units)
const CAP_EM = 0.7; // cap height of the lettering, in em
const FACE = 1.15; // profile turn when walking sideways

type Lay = { fs: number; P: number; baseY: number; bMid: number; end: number; cap: number; stageH: number; stageW: number; top: number; lx: number[] };

export function HeaderLogo() {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const bRef = useRef<HTMLSpanElement | null>(null);
  const baseRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zzzRef = useRef<HTMLSpanElement>(null);
  const letterEls = useRef<(HTMLSpanElement | null)[]>([]);
  const [lay, setLay] = useState<Lay | null>(null);
  const live = useRef<{ pose: Pose | null; lift: number; behind: number }>({ pose: null, lift: 0, behind: 0 });

  // measure once the font is ready; re-measure when the breakpoint changes
  useEffect(() => {
    let dead = false;
    const measure = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        /* measure anyway */
      }
      const w = wrapRef.current, b = bRef.current, base = baseRef.current;
      if (dead || !w || !b || !base) return;
      const wr = w.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(w).fontSize) || 30;
      const P = fs * 0.29; // px per world unit: Sunny ≈ as tall as the capitals
      const stageH = VIEW_H * P;
      const baseY = base.getBoundingClientRect().bottom - wr.top;
      const lx = letterEls.current.map((el) => (el ? el.getBoundingClientRect().left - wr.left + el.getBoundingClientRect().width / 2 : 0));
      setLay({ lx, fs, P, baseY, bMid: br.left - wr.left + br.width / 2, end: wr.width - fs * 0.35, cap: CAP_EM * fs, stageH, stageW: stageH * 1.6, top: baseY - FEET * P - stageH / 2 });
    };
    void measure();
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => void measure();
    mq.addEventListener("change", on);
    return () => {
      dead = true;
      mq.removeEventListener("change", on);
    };
  }, []);

  // keep Sunny's own small canvas glued to him (every frame)
  useEffect(() => {
    if (!lay) return;
    const tick = () => {
      const st = stageRef.current;
      const p = live.current.pose;
      if (!st) return;
      const x = p ? p.x * lay.P : 0;
      st.style.transform = `translate3d(${(x - lay.stageW / 2).toFixed(2)}px, ${(-live.current.lift).toFixed(2)}px, 0)`;
      if (wordRef.current) wordRef.current.style.zIndex = live.current.behind > 0.5 ? "3" : "1";
    };
    gsap.ticker.add(tick);
    tick();
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [lay]);

  const rig: Rig | undefined = useMemo(() => {
    if (!lay) return undefined;
    return ({ pose, setExpr }: RigApi) => {
      const S = live.current;
      S.pose = pose;
      const xB = lay.bMid / lay.P; // world x of the B's middle (stage x=0 is the wordmark's left edge)
      const xEnd = lay.end / lay.P;
      const sitLegs = { hip: -1.5, knee: 1.25 };
      const sitArms = { fwd: 0.35, raise: 0.4, bend: 0.25, grip: 0.4 };
      const armsRest = { fwd: 0, raise: 0, bend: 0.3, grip: 0.35 };
      const zzz = (on: boolean) => {
        if (zzzRef.current) zzzRef.current.style.opacity = on ? "1" : "0";
      };

      const asleep = () => {
        pose.x = xB; pose.y = SIT_Y; pose.turn = 0; pose.tilt = 0; pose.roll = 0; pose.squash = 1;
        pose.walk = 0; pose.run = 0; pose.shades = 0;
        Object.assign(pose.legL, sitLegs); Object.assign(pose.legR, sitLegs);
        Object.assign(pose.armL, sitArms); Object.assign(pose.armR, sitArms);
        S.lift = lay.cap; S.behind = 0;
        setExpr("sleep");
      };
      asleep();
      if (reduced) {
        zzz(true);
        return;
      }

      const tl = gsap.timeline({ repeat: -1 });
      // ---- 1. asleep on the B, legs swinging, gentle snooze sway ----
      tl.call(() => { asleep(); zzz(true); }, [], 0)
        .to(pose.legL, { hip: -1.75, knee: 0.9, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 7 }, 0)
        .to(pose.legR, { hip: -1.25, knee: 1.5, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 7 }, 0)
        .to(pose, { tilt: 0.05, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0);
      // ---- 2. wakes up with a start, stretches, shades on ----
      const W = 5.6;
      tl.call(() => { zzz(false); setExpr("surprised"); }, [], W)
        .to(pose, { y: SIT_Y + 0.35, squash: 1.08, duration: 0.18, ease: "power2.out" }, W)
        .to(pose, { y: SIT_Y, squash: 0.95, duration: 0.2, ease: "power2.in" }, W + 0.18)
        .to(pose, { squash: 1, duration: 0.2 }, W + 0.38)
        .to([pose.armL, pose.armR], { raise: 2.5, fwd: 0, bend: 0.2, grip: 0, duration: 0.4, ease: "back.out(2)" }, W + 0.3)
        .call(() => setExpr("normal"), [], W + 0.9)
        .to(pose, { shades: 1, duration: 0.5, ease: "bounce.out" }, W + 1.0);
      // ---- 3. silly business on the B: wiggle, kick, wave ----
      const F = W + 1.8;
      tl.to(pose, { tilt: 0.28, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 7 }, F)
        .to(pose.legL, { hip: -1.9, knee: 0.4, duration: 0.16, yoyo: true, repeat: 9, ease: "sine.inOut" }, F)
        .to(pose.legR, { hip: -1.1, knee: 1.7, duration: 0.16, yoyo: true, repeat: 9, ease: "sine.inOut" }, F)
        .to(pose.armR, { raise: 2.4, fwd: 0, duration: 0.2, yoyo: true, repeat: 7, ease: "sine.inOut" }, F)
        .to(pose.armL, { raise: 1.6, fwd: 0.4, duration: 0.2 }, F)
        .to(pose, { y: SIT_Y + 0.45, duration: 0.2, ease: "power2.out", yoyo: true, repeat: 3 }, F + 0.4)
        .to(pose, { tilt: 0, duration: 0.15 }, F + 1.7);
      const TAU = Math.PI * 2;
      const bump = (i: number, at: number) => {
        const el = letterEls.current[i];
        if (el) tl.to(el, { y: -lay.fs * 0.16, rotate: i % 2 ? 5 : -5, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1 }, at);
      };
      // letters wobble as Sunny passes (in front or behind): scheduled from his x-travel
      const bumpAlong = (t0: number, t1: number, xa: number, xb: number) =>
        lay.lx.forEach((cx, i) => {
          const f = (cx - xa) / (xb - xa);
          if (f >= 0 && f <= 1) bump(i, t0 + f * (t1 - t0));
        });
      const pxB = lay.bMid, pxEnd = lay.end, pxMid = (lay.bMid + lay.end) / 2;
      const xMid = xB + (xEnd - xB) / 2;

      // ---- 4. jumps down, lands in front of the letters ----
      const J = F + 2.0;
      tl.call(() => setExpr("happy"), [], J)
        .to(pose, { y: SIT_Y + 1.0, squash: 1.1, duration: 0.28, ease: "power2.out" }, J)
        .to([pose.legL, pose.legR], { hip: -0.4, knee: 0.9, duration: 0.25 }, J)
        .to([pose.armL, pose.armR], { raise: 2.4, fwd: 0, bend: 0.2, grip: 0, duration: 0.25 }, J)
        .to(pose, { y: 0, squash: 0.8, duration: 0.34, ease: "power2.in" }, J + 0.28)
        .to(S, { lift: 0, duration: 0.34, ease: "power2.in" }, J + 0.28)
        .to([pose.legL, pose.legR], { hip: 0, knee: 0, duration: 0.2 }, J + 0.5)
        .to(pose, { squash: 1, duration: 0.45, ease: "elastic.out(1,0.5)" }, J + 0.62)
        .to([pose.armL, pose.armR], { ...armsRest, duration: 0.3 }, J + 0.65);
      bump(0, J + 0.6);

      // ---- 5a. victory dance (alternating arms, hops, wiggle) ----
      const D = J + 1.1;
      tl.to(pose.armL, { raise: 2.3, fwd: 0, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 7 }, D)
        .fromTo(pose.armR, { raise: 2.3 }, { raise: 0.2, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 7 }, D)
        .to(pose, { tilt: 0.2, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 7 }, D)
        .to(pose, { y: 0.28, duration: 0.25, ease: "power1.out", yoyo: true, repeat: 7 }, D)
        .to(pose, { turn: 0.5, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3 }, D)
        .to([pose.armL, pose.armR], { ...armsRest, duration: 0.25 }, D + 2.05)
        .to(pose, { tilt: 0, turn: 0, y: 0, duration: 0.2 }, D + 2.05);

      // ---- 5b. slips on a banana peel: dizzy spin ----
      const TR = D + 2.4;
      tl.call(() => setExpr("surprised"), [], TR)
        .to(pose, { tilt: -0.5, y: 0.25, duration: 0.18, ease: "power2.out" }, TR)
        .to(pose, { tilt: 0.7, y: 0, squash: 0.82, duration: 0.2, ease: "power2.in" }, TR + 0.18)
        .call(() => setExpr("dizzy"), [], TR + 0.38)
        .to(pose, { turn: TAU, duration: 0.8, ease: "power2.out" }, TR + 0.4)
        .to(pose, { tilt: 0, squash: 1, duration: 0.5, ease: "elastic.out(1,0.5)" }, TR + 0.45)
        .set(pose, { turn: 0 }, TR + 1.25)
        .to(pose, { tilt: 0.16, duration: 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, TR + 1.25)
        .call(() => setExpr("happy"), [], TR + 2.0)
        .to(pose, { tilt: 0, duration: 0.15 }, TR + 2.0);
      bump(2, TR + 0.2);

      // ---- 5c. TIGHTROPE: hops up and walks along the tops of the letters, wobbles, nearly falls ----
      const W0 = TR + 2.3;
      tl.call(() => setExpr("normal"), [], W0)
        .to(pose, { y: 0.7, squash: 1.1, duration: 0.25, ease: "power2.out" }, W0)
        .to(S, { lift: lay.cap, duration: 0.5, ease: "power2.inOut" }, W0)
        .to(pose, { y: 0, squash: 0.85, duration: 0.25, ease: "power2.in" }, W0 + 0.25)
        .to(pose, { squash: 1, duration: 0.3, ease: "elastic.out(1,0.5)" }, W0 + 0.5)
        .to([pose.armL, pose.armR], { raise: 1.5, fwd: 0, bend: 0.1, grip: 0, duration: 0.3 }, W0 + 0.2)
        .to(pose, { turn: FACE, duration: 0.2 }, W0 + 0.8)
        .set(pose, { walk: 1 }, W0 + 0.8)
        .to(pose, { x: xMid, duration: 1.8, ease: "none" }, W0 + 0.9)
        .set(pose, { walk: 0 }, W0 + 2.7)
        .call(() => setExpr("surprised"), [], W0 + 2.7)
        .to(pose, { tilt: 0.38, duration: 0.15, yoyo: true, repeat: 9, ease: "sine.inOut" }, W0 + 2.7)
        .fromTo(pose.armL, { raise: 0.3 }, { raise: 2.5, duration: 0.15, yoyo: true, repeat: 9, ease: "sine.inOut" }, W0 + 2.7)
        .fromTo(pose.armR, { raise: 2.5 }, { raise: 0.3, duration: 0.15, yoyo: true, repeat: 9, ease: "sine.inOut" }, W0 + 2.7)
        .to(pose, { tilt: 0, duration: 0.15 }, W0 + 4.2)
        .call(() => setExpr("happy"), [], W0 + 4.2)
        .to([pose.armL, pose.armR], { raise: 1.5, fwd: 0, duration: 0.2 }, W0 + 4.2)
        .set(pose, { walk: 1 }, W0 + 4.4)
        .to(pose, { x: xEnd, duration: 1.8, ease: "none" }, W0 + 4.4)
        .set(pose, { walk: 0 }, W0 + 6.2)
        // looks down, gulps, hops off the far end
        .call(() => setExpr("surprised"), [], W0 + 6.2)
        .to(pose, { turn: 0, duration: 0.25 }, W0 + 6.2)
        .to(pose, { squash: 0.9, duration: 0.2, yoyo: true, repeat: 1 }, W0 + 6.4)
        .call(() => setExpr("happy"), [], W0 + 7.0)
        .to(pose, { y: 1.0, squash: 1.1, duration: 0.28, ease: "power2.out" }, W0 + 7.0)
        .to([pose.armL, pose.armR], { raise: 2.4, fwd: 0, duration: 0.25 }, W0 + 7.0)
        .to(pose, { y: 0, squash: 0.8, duration: 0.34, ease: "power2.in" }, W0 + 7.28)
        .to(S, { lift: 0, duration: 0.34, ease: "power2.in" }, W0 + 7.28)
        .to(pose, { squash: 1, duration: 0.45, ease: "elastic.out(1,0.5)" }, W0 + 7.62)
        .to([pose.armL, pose.armR], { ...armsRest, duration: 0.3 }, W0 + 7.7);

      // ---- 5d. spins round and MOONWALKS back to the B ----
      const M = W0 + 8.2;
      tl.call(() => setExpr("happy"), [], M)
        .to(pose, { turn: -TAU + 1.25, duration: 0.5, ease: "power2.out" }, M)
        .set(pose, { turn: 1.25 }, M + 0.5)
        .to(pose, { moon: 1, duration: 0.25 }, M + 0.55)
        .to(pose, { x: xB, duration: 3.0, ease: "none" }, M + 0.55)
        .to(pose, { moon: 0, duration: 0.3 }, M + 3.4)
        .to(pose, { turn: 0, duration: 0.3 }, M + 3.5);
      bumpAlong(M + 0.55, M + 3.55, pxEnd, pxB);
      const R = M - 5.3 + 4.3; // (so B0 below = M + 3.9)

      // ---- 5e. curls into a ball and ROLLS along the word, pops out dizzy ----
      const B0 = R + 5.3 - 0; // = M + 4.3
      tl.to(pose, { limbs: 0, y: BALL_Y, duration: 0.3, ease: "power2.in" }, B0)
        .to(pose, { x: xEnd, roll: -TAU * 2, duration: 2.0, ease: "power2.inOut" }, B0 + 0.3)
        .call(() => setExpr("surprised"), [], B0 + 2.3)
        .to(pose, { y: 0.55, squash: 1.12, duration: 0.32, ease: "power2.out" }, B0 + 2.3)
        .to(pose, { limbs: 1, duration: 0.45, ease: "back.out(2.4)" }, B0 + 2.3)
        .to(pose, { y: 0, squash: 0.85, duration: 0.28, ease: "power2.in" }, B0 + 2.62)
        .set(pose, { roll: 0 }, B0 + 2.9)
        .to(pose, { squash: 1, duration: 0.4, ease: "elastic.out(1,0.5)" }, B0 + 2.9)
        .call(() => setExpr("dizzy"), [], B0 + 2.9)
        .to(pose, { tilt: 0.2, duration: 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, B0 + 2.9)
        .call(() => setExpr("normal"), [], B0 + 3.7);
      bumpAlong(B0 + 0.3, B0 + 2.3, pxB, pxEnd);

      // ---- 5f. sneaks back INSIDE the word (behind the letters), peeks out half way ----
      const T = B0 + 4.0;
      tl.set(S, { behind: 1 }, T)
        .to(pose, { turn: -FACE, duration: 0.2 }, T)
        .set(pose, { walk: 1 }, T)
        .to(pose, { x: xMid, duration: 1.6, ease: "none" }, T + 0.1)
        .set(pose, { walk: 0 }, T + 1.7)
        .set(S, { behind: 0 }, T + 1.7)
        .to(pose, { turn: 0, duration: 0.2 }, T + 1.7)
        .call(() => setExpr("surprised"), [], T + 1.8)
        .to(pose, { y: 0.45, squash: 1.1, duration: 0.2, ease: "power2.out", yoyo: true, repeat: 1 }, T + 1.8)
        .to(pose.armR, { raise: 2.4, fwd: 0, grip: 0, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, T + 1.9)
        .call(() => setExpr("happy"), [], T + 2.3)
        .to(pose.armR, { ...armsRest, duration: 0.2 }, T + 3.0)
        .set(S, { behind: 1 }, T + 3.1)
        .to(pose, { turn: -FACE, duration: 0.2 }, T + 3.1)
        .set(pose, { walk: 1 }, T + 3.2)
        .to(pose, { x: xB, duration: 1.8, ease: "none" }, T + 3.3)
        .set(pose, { walk: 0 }, T + 5.1)
        .to(pose, { turn: 0, duration: 0.25 }, T + 5.1)
        .call(() => setExpr("normal"), [], T + 5.2);
      bumpAlong(T + 0.1, T + 1.7, pxEnd, pxMid);
      bumpAlong(T + 3.3, T + 5.1, pxMid, pxB);

      // ---- 6. climbs back up behind the B, turns round, sits, takes the shades off, dozes ----
      const C = T + 5.5;
      tl.to(pose, { y: 0.9, squash: 0.88, duration: 0.2, ease: "power2.in" }, C)
        .to(pose, { squash: 1.08, y: 1.5, duration: 0.3, ease: "power2.out" }, C + 0.2)
        .to(S, { lift: lay.cap, duration: 0.45, ease: "power2.inOut" }, C + 0.2)
        .to([pose.armL, pose.armR], { raise: 2.2, fwd: 0, grip: 0.6, duration: 0.3 }, C + 0.2)
        .set(S, { behind: 0 }, C + 0.6)
        .to(pose, { y: SIT_Y, squash: 0.92, duration: 0.28, ease: "power2.in" }, C + 0.55)
        .to([pose.legL, pose.legR], { ...sitLegs, duration: 0.3 }, C + 0.55)
        .to([pose.armL, pose.armR], { ...sitArms, duration: 0.3 }, C + 0.6)
        .to(pose, { squash: 1, duration: 0.4, ease: "elastic.out(1,0.5)" }, C + 0.85)
        .to(pose, { shades: 0, duration: 0.3 }, C + 1.3)
        .call(() => setExpr("sleep"), [], C + 1.7)
        .to({}, { duration: 0.3 }, C + 2.2);

      return () => {
        tl.kill();
        S.pose = null;
      };
    };
  }, [lay, reduced]);

  return (
    <div ref={wrapRef} className="relative z-10 w-fit shrink-0 text-[1.65rem] leading-none md:text-[1.9rem]">
      <Link href="/" aria-label={`${siteConfig.name} — home`} className="relative block">
        <span ref={wordRef} aria-hidden className="relative z-[1] inline-block whitespace-pre font-hero font-extrabold leading-none tracking-[-0.045em]">
          {"BrightSun".split("").map((c, i) => (
            <span
              key={i}
              ref={(el) => {
                letterEls.current[i] = el;
                if (i === 0) bRef.current = el;
              }}
              className={`inline-block will-change-transform ${i < 6 ? "text-espresso" : "text-sun"}`}
            >
              {c}
            </span>
          ))}
          <i ref={baseRef} style={{ display: "inline-block", width: 0, height: 0 }} />
        </span>
      </Link>

      {lay && (
        <>
          <div
            ref={stageRef}
            aria-hidden
            {...({ inert: true } as object)}
            className="pointer-events-none absolute left-0 will-change-transform"
            style={{ top: lay.top, width: lay.stageW, height: lay.stageH, zIndex: 2 }}
          >
            <MascotStage key={`${lay.fs}`} rig={rig} fixedCamera noFallback className="pointer-events-none !rounded-none h-full w-full" />
          </div>
          <span
            ref={zzzRef}
            aria-hidden
            className="hb-zzz pointer-events-none absolute z-[4] font-hero font-extrabold text-sun opacity-0 transition-opacity duration-300"
            style={{ left: lay.bMid + lay.fs * 0.35, top: lay.baseY - lay.cap - lay.fs * 0.85, fontSize: lay.fs * 0.34 }}
          >
            z<span style={{ fontSize: "1.25em" }}>z</span>
            <span style={{ fontSize: "1.5em" }}>Z</span>
          </span>
          <style>{`
            .hb-zzz span{display:inline-block;margin-left:.08em;animation:hb-z 2.4s ease-in-out infinite}
            .hb-zzz span:nth-child(2){animation-delay:.5s}
            @keyframes hb-z{0%{transform:translateY(4px);opacity:0}30%{opacity:1}100%{transform:translateY(-6px);opacity:0}}
            @media (prefers-reduced-motion: reduce){.hb-zzz span{animation:none}}
          `}</style>
        </>
      )}
    </div>
  );
}
