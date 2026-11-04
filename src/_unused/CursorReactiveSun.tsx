"use client";

import { useEffect, useRef, type RefObject } from "react";

type Props = {
  /** Clip encoded with every frame as a keyframe, so scrubbing stays smooth. */
  src: string;
  poster?: string;
  /** Element whose area drives the interaction (defaults to the component's parent). */
  areaRef?: RefObject<HTMLElement | null>;
  /** Playback time (s) shown at rest, when the cursor is outside the area. */
  restTime?: number;
  className?: string;
};

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";
/** Soft vignette so the clip's square edges dissolve into the page. */
const FADE = "radial-gradient(closest-side, #000 72%, transparent 100%)";

/**
 * Hero mascot driven by a video. On desktop the cursor's X position inside
 * the hero maps to playback time (the sun turns / reacts), with eased
 * smoothing, a subtle tilt + parallax on the container and an idle float.
 * On touch devices it simply autoplays the loop.
 */
export function CursorReactiveSun({ src, poster, areaRef, restTime = 2.67, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const video = videoRef.current;
    if (!root || !body || !video) return;

    const fine = window.matchMedia(FINE_POINTER).matches;
    const reduced = window.matchMedia(REDUCED).matches;

    // Touch / mobile: plain muted autoplay loop, no tracking.
    if (!fine) {
      video.loop = true;
      if (reduced) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
      return;
    }

    // Desktop: scrub currentTime from the cursor.
    video.loop = false;
    video.pause();

    const area = areaRef?.current ?? root.parentElement ?? root;
    let duration = Number.isFinite(video.duration) ? video.duration : 0;

    // Normalised pointer target (0..1) and smoothed state.
    let active = false;
    let tx = 0.5;
    let ty = 0.5;
    let sx = 0.5;
    let sy = 0.5;
    let targetTime = restTime;
    let shownTime = restTime;
    let lastSeek = -1;

    const onMeta = () => {
      duration = video.duration;
      shownTime = Math.min(restTime, duration);
      video.currentTime = shownTime;
    };
    if (video.readyState >= 1) onMeta();
    else video.addEventListener("loadedmetadata", onMeta);

    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      active = true;
    };
    const onLeave = () => {
      active = false;
      tx = 0.5;
      ty = 0.5;
    };
    area.addEventListener("pointermove", onMove, { passive: true });
    area.addEventListener("pointerleave", onLeave);

    // Only animate while the hero is on screen.
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(root);

    let raf = 0;
    let prev = performance.now();
    const t0 = prev;

    function tick(now: number) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      // Frame-rate independent easing.
      const ease = (k: number) => 1 - Math.exp(-k * dt);
      sx += (tx - sx) * ease(5);
      sy += (ty - sy) * ease(5);

      if (duration > 0) {
        targetTime = active ? tx * (duration - 0.05) : Math.min(restTime, duration);
        shownTime += (targetTime - shownTime) * ease(active ? 7 : 3);
        // Seek only when the frame really changes and the decoder is free.
        if (Math.abs(shownTime - lastSeek) > 1 / 50 && !video!.seeking) {
          video!.currentTime = shownTime;
          lastSeek = shownTime;
        }
      }

      const nx = sx - 0.5;
      const ny = sy - 0.5;
      const t = (now - t0) / 1000;
      const floatY = reduced ? 0 : Math.sin(t * 1.4) * 7;
      const floatR = reduced ? 0 : Math.sin(t * 0.9) * 0.8;
      body!.style.transform =
        `translate3d(${(nx * 26).toFixed(2)}px, ${(ny * 16 + floatY).toFixed(2)}px, 0) ` +
        `rotate(${(nx * 5 + floatR).toFixed(2)}deg)`;

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [areaRef, restTime]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Warm halo behind the character */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,194,51,0.38)_0%,rgba(255,138,29,0.12)_45%,transparent_70%)] blur-2xl"
      />
      <div ref={bodyRef} className="relative h-full w-full will-change-transform">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="auto"
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none h-full w-full select-none object-cover mix-blend-multiply"
          style={{ maskImage: FADE, WebkitMaskImage: FADE }}
        />
      </div>
    </div>
  );
}
