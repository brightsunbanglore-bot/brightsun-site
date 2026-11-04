"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { mascotState } from "./mascotState";
import type { Rig } from "./sunnyPose";

const MascotScene = dynamic(() => import("./MascotScene"), { ssr: false, loading: () => null });

type Support = "full" | "lite" | "none";
let support: Support | null = null;

/** WebGL availability + a rough device class (slow devices get the fallback). */
function detect(): Support {
  if (support) return support;
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") ?? c.getContext("webgl") ?? c.getContext("experimental-webgl"))) return "none"; // not cached: tried again next time
  } catch {
    return "none";
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const small = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  // Slow / low-memory / data-saver devices still get the real 3D Sunny, just a lighter version of it.
  const modest = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 2 || !!nav.connection?.saveData;
  return (support = small || modest ? "lite" : "full");
}
const noop = () => () => {};
const subscribeCompact = (cb: () => void) => {
  const mq = window.matchMedia("(max-width: 1023px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Bounded stage for the mascot. The canvas stays strictly inside this box
 * (overflow clipped), never catches clicks, and loads after first paint.
 * Clicking / tapping / pressing Enter pokes Sunny (giggle; 3 quick pokes = dizzy).
 */
export function MascotStage({ className = "", rig, fixedCamera = false, }: { className?: string; rig?: Rig; fixedCamera?: boolean; noFallback?: boolean }) {
  const tier = useSyncExternalStore(noop, detect, () => null);
  const compact = useSyncExternalStore(subscribeCompact, () => window.matchMedia("(max-width: 1023px)").matches, () => false);
  const reducedMotion = usePrefersReducedMotion();
  const box = useRef<HTMLButtonElement>(null);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const failed = false; // never give up on the 3D Sunny: it keeps loading instead of swapping to a flat picture
  const [active, setActive] = useState(true);

  const handleReady = useCallback(() => setReady(true), []);

  // Lazy-load WebGL once the browser is idle.
  useEffect(() => {
    if (!tier || tier === "none") return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMount(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMount(true), 300);
    return () => clearTimeout(id);
  }, [tier]);


  // Review helper: ?sunny=dance|sit|wave|peek plays that act first.
  useEffect(() => {
    mascotState.firstAct = new URLSearchParams(window.location.search).get("sunny") ?? "";
  }, []);

  // Pause off-screen; pointer follow relative to the stage.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    let anchor: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (mascotState.pointerFrozen) {
        anchor = anchor ?? { x: e.clientX, y: e.clientY };
        if (Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) < 120) return;
        mascotState.pointerFrozen = false;
        anchor = null;
      }
      const r = el.getBoundingClientRect();
      const rx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ry = -(e.clientY - (r.top + r.height / 2)) / r.height;
      // cursor well outside the stage (e.g. over the headline): Sunny just looks straight ahead
      const outside = Math.abs(rx) > 0.7 || Math.abs(ry) > 0.7;
      mascotState.pointerX = outside ? 0 : clamp(rx);
      mascotState.pointerY = outside ? 0 : clamp(ry);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      mascotState.pointerX = 0;
      mascotState.pointerY = 0;
    };
  }, []);

  const show3d = mount && !failed && tier && tier !== "none";

  return (
    <button
      ref={box}
      type="button"
      onClick={() => {
        mascotState.pokes += 1;
      }}
      onPointerEnter={() => {
        mascotState.hover = true;
      }}
      onPointerLeave={() => {
        mascotState.hover = false;
      }}
      aria-label="Poke Sunny, the BrightSun mascot"
      className={`relative block overflow-hidden rounded-[32px] outline-none focus-visible:ring-2 focus-visible:ring-flame ${className}`}
    >
      {/* Never a flat picture: only the real 3D Sunny is ever shown. */}
      {show3d && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <MascotScene
            lite={tier === "lite"}
            compact={compact}
            reducedMotion={reducedMotion}
            active={active}
            onReady={handleReady}
            rig={rig}
            fixedCamera={fixedCamera}
          />
        </div>
      )}
    </button>
  );
}
