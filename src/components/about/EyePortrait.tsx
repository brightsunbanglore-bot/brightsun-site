"use client";

import { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
   The animated founder picture. The picture itself never moves and the eyes
   look straight ahead. Only a natural blink: a real "eyes closed" picture of
   the same person is faded in over the eye area for a split second.
--------------------------------------------------------------------------- */

const SIZE = 1254;
// the strip of the picture that the closed-eye overlay covers (picture pixels)
const BOX = { x: 440, y: 330, w: 370, h: 130 };

const SRC: Record<string, { open: string; closed: string }> = {
  swathi: { open: "/founders/swathi-3d.jpg", closed: "/founders/swathi-closed.png" },
  arun: { open: "/founders/arun-3d.jpg", closed: "/founders/arun-closed.png" },
};

const ease = (x: number) => x * x * (3 - 2 * x);

export default function EyePortrait({ kind, label }: { kind: "swathi" | "arun"; label: string }) {
  const s = SRC[kind];
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current!;
    const g = canvas.getContext("2d")!;
    const img = new Image();
    let raf = 0, alive = true, visible = true, ready = false;
    let blinkT = -1, next = 1.2 + Math.random() * 2, shown = 0;

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "150px" });
    io.observe(canvas);

    const loop = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (!visible || !ready) return;
      const t = now / 1000;
      let a = 0;
      if (blinkT < 0 && t > next) blinkT = t;
      if (blinkT >= 0) {
        const T = t - blinkT;
        if (T < 0.07) a = ease(T / 0.07);
        else if (T < 0.11) a = 1;
        else if (T < 0.3) a = 1 - ease((T - 0.11) / 0.19);
        else { a = 0; blinkT = -1; next = t + (Math.random() < 0.2 ? 0.3 : 2.6 + Math.random() * 3.4); }
      }
      if (Math.abs(a - shown) < 0.004) return;
      shown = a;
      g.clearRect(0, 0, BOX.w, BOX.h);
      if (a > 0) { g.globalAlpha = a; g.drawImage(img, 0, 0); g.globalAlpha = 1; }
    };

    img.onload = () => { if (alive) { ready = true; raf = requestAnimationFrame(loop); } };
    img.src = s.closed;
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
  }, [s]);

  return (
    <div
      role="img"
      aria-label={label}
      className="relative aspect-square w-full"
      style={{
        WebkitMaskImage: "radial-gradient(ellipse 58% 62% at 50% 44%, #000 62%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 58% 62% at 50% 44%, #000 62%, transparent 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.open} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      <canvas
        ref={cv}
        width={BOX.w}
        height={BOX.h}
        className="absolute"
        style={{ left: `${(BOX.x / SIZE) * 100}%`, top: `${(BOX.y / SIZE) * 100}%`, width: `${(BOX.w / SIZE) * 100}%`, height: `${(BOX.h / SIZE) * 100}%` }}
      />
    </div>
  );
}
