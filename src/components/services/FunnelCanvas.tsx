"use client";

import { useEffect, useRef } from "react";

/**
 * Conversion funnel: a glass funnel drawn on canvas. Visitors spiral down the vortex as tiny
 * suns, some drop away at each gate, the rest become gold customers that fly into the glowing
 * orb. Illustrative only: no numbers. Pauses off-screen, calm under reduced motion.
 */
const CX = 200;
const RIM_Y = 50;
const RIM_W = 140;
const NECK_Y = 250;
const NECK_W = 35;
const END_Y = 338;
const ORB_Y = 376;
const GATES = [
  { y: 112, label: "Visitors" },
  { y: 170, label: "Interested" },
  { y: 226, label: "Leads" },
];
const hw = (y: number) => (y <= RIM_Y ? RIM_W : y >= NECK_Y ? NECK_W : RIM_W - (RIM_W - NECK_W) * ((y - RIM_Y) / (NECK_Y - RIM_Y)));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (c1: number[], c2: number[], t: number) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
const GREY = [201, 189, 180], GOLD = [255, 194, 51], FLAME = [255, 138, 29];
const colAt = (t: number) => (t < 0.5 ? mix(GREY, GOLD, t / 0.5) : mix(GOLD, FLAME, (t - 0.5) / 0.5));

type P = { y: number; ang: number; r: number; spd: number; spin: number; size: number; fail: number; trail: { x: number; y: number }[]; dead: number; passed: number };
type Coin = { x: number; y: number; t: number };
type Pulse = { y: number; t: number };

export function FunnelCanvas() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    root.insertBefore(canvas, root.firstChild);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 1, H = 1, dpr = 1, s = 1, ox = 0, oy = 0;
    const resize = () => {
      const r = root.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      s = Math.min(W / 430, (H - 54) / 410);
      ox = (W - 400 * s) / 2;
      oy = 6;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const parts: P[] = [];
    const spawn = (y0 = 14 + rnd() * 20): P => ({
      y: y0,
      ang: rnd() * Math.PI * 2,
      r: 0.12 + rnd() * 0.78,
      spd: 26 + rnd() * 12,
      spin: (rnd() < 0.5 ? -1 : 1) * (1.4 + rnd() * 1.2),
      size: 3.6 + rnd() * 3,
      fail: rnd() < 0.62 ? Math.floor(rnd() * 3) : -1,
      trail: [],
      dead: 0,
      passed: 0,
    });
    for (let i = 0; i < 34; i++) parts.push(spawn(14 + (i / 34) * 300));
    const coins: Coin[] = [];
    const pulses: Pulse[] = [];
    let orb = 0, hover = 0, ptrX = 0.5;
    const gateHit = [0, 0, 0];

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      ptrX = (e.clientX - r.left) / r.width;
    };
    root.addEventListener("pointermove", onMove);

    const xyOf = (p: P) => {
      const w = hw(p.y) * 0.9;
      return { x: CX + Math.sin(p.ang) * p.r * w, z: Math.cos(p.ang), w };
    };

    const dot = (x: number, y: number, rad: number, c: number[], a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 3.2);
      g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.38})`);
      g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad * 3.2, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.65})`;
      ctx.beginPath();
      ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.38, 0, 6.283);
      ctx.fill();
    };

    const drawParticles = (front: boolean) => {
      for (const p of parts) {
        const { x, z } = xyOf(p);
        if ((z >= 0) !== front) continue;
        const t = Math.min(1, Math.max(0, (p.y - 14) / (END_Y - 14)));
        const c = p.fail >= 0 && p.dead ? GREY : colAt(t);
        const depth = 0.72 + 0.28 * z;
        const a = (front ? 1 : 0.55) * (p.dead ? Math.max(0, 1 - p.dead * 1.8) : 1) * Math.min(1, (p.y - 8) / 18) * depth;
        if (a <= 0.01) continue;
        // trail
        const tr = p.trail;
        for (let i = 1; i < tr.length; i++) {
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(i / tr.length) * 0.4 * a})`;
          ctx.lineWidth = p.size * 0.7 * (i / tr.length);
          ctx.beginPath();
          ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
          ctx.lineTo(tr[i].x, tr[i].y);
          ctx.stroke();
        }
        dot(x, p.y, p.size * (0.8 + 0.25 * z) * (1 - t * 0.25), c, a);
      }
    };

    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(CX - RIM_W, RIM_Y);
      ctx.lineTo(CX + RIM_W, RIM_Y);
      ctx.lineTo(CX + NECK_W, NECK_Y);
      ctx.lineTo(CX + NECK_W, END_Y);
      ctx.quadraticCurveTo(CX, END_Y + 12, CX - NECK_W, END_Y);
      ctx.lineTo(CX - NECK_W, NECK_Y);
      ctx.closePath();
    };

    const render = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const par = (ptrX - 0.5) * 10;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + par * 0.4), dpr * oy);

      // ground shadow
      const sh = ctx.createRadialGradient(CX, 396, 0, CX, 396, 120);
      sh.addColorStop(0, "rgba(35,27,24,.16)");
      sh.addColorStop(1, "rgba(35,27,24,0)");
      ctx.fillStyle = sh;
      ctx.save();
      ctx.translate(0, 396);
      ctx.scale(1, 0.14);
      ctx.translate(0, -396);
      ctx.beginPath();
      ctx.arc(CX, 396, 120, 0, 6.283);
      ctx.fill();
      ctx.restore();

      // inside back of the rim
      const inner = ctx.createLinearGradient(0, RIM_Y - 16, 0, RIM_Y + 16);
      inner.addColorStop(0, "#F1DFC0");
      inner.addColorStop(1, "#FFF6E3");
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.ellipse(CX, RIM_Y, RIM_W, 17, 0, 0, 6.283);
      ctx.fill();

      drawParticles(false);

      // glass body
      bodyPath();
      const gl = ctx.createLinearGradient(0, RIM_Y, 0, END_Y);
      gl.addColorStop(0, "rgba(255,255,255,.62)");
      gl.addColorStop(0.7, "rgba(255,236,196,.34)");
      gl.addColorStop(1, "rgba(255,194,51,.34)");
      ctx.fillStyle = gl;
      ctx.fill();
      ctx.save();
      bodyPath();
      ctx.clip();
      // side shading for roundness
      const side = ctx.createLinearGradient(CX - RIM_W, 0, CX + RIM_W, 0);
      side.addColorStop(0, "rgba(35,27,24,.07)");
      side.addColorStop(0.22, "rgba(255,255,255,.28)");
      side.addColorStop(0.5, "rgba(255,255,255,0)");
      side.addColorStop(0.85, "rgba(255,138,29,.08)");
      side.addColorStop(1, "rgba(255,138,29,.16)");
      ctx.fillStyle = side;
      ctx.fillRect(0, RIM_Y, 400, 300);
      // sweeping sheen
      const sx = ((time * 0.00022) % 1.6) * 520 - 120;
      const sg = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
      sg.addColorStop(0, "rgba(255,255,255,0)");
      sg.addColorStop(0.5, "rgba(255,255,255,.55)");
      sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.save();
      ctx.transform(1, 0, -0.35, 1, 0, 0);
      ctx.fillRect(sx - 40 + 0.35 * 200, RIM_Y, 80, 300);
      ctx.restore();
      // liquid level in the neck grows a little with every customer
      const lvl = 18 + orb * 36;
      const lg = ctx.createLinearGradient(0, END_Y - lvl, 0, END_Y);
      lg.addColorStop(0, "rgba(255,194,51,.0)");
      lg.addColorStop(1, "rgba(255,138,29,.55)");
      ctx.fillStyle = lg;
      ctx.fillRect(CX - NECK_W, END_Y - lvl, NECK_W * 2, lvl + 14);
      ctx.restore();

      // gates
      GATES.forEach((g, i) => {
        const w = hw(g.y);
        const pulse = gateHit[i];
        ctx.strokeStyle = `rgba(255,138,29,${0.28 + pulse * 0.6})`;
        ctx.lineWidth = 2 + pulse * 2.2;
        ctx.beginPath();
        ctx.ellipse(CX, g.y, w, w * 0.11, 0, 0, 6.283);
        ctx.stroke();
      });

      drawParticles(true);

      // coins
      for (const c of coins) {
        const k = Math.min(1, c.t);
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(Math.cos(c.t * 14) * 0.5 + 0.55, 1);
        const cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
        cg.addColorStop(0, "#FFF3C4");
        cg.addColorStop(0.5, "#FFC233");
        cg.addColorStop(1, "#E07A10");
        ctx.fillStyle = cg;
        ctx.globalAlpha = 1 - k * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }

      // rim front + edge
      const eg = ctx.createLinearGradient(CX - RIM_W, 0, CX + RIM_W, 0);
      eg.addColorStop(0, "#FFFFFF");
      eg.addColorStop(0.45, "#FFC233");
      eg.addColorStop(1, "#FF8A1D");
      ctx.strokeStyle = eg;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      bodyPath();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(CX, RIM_Y, RIM_W, 17, 0, 0, 6.283);
      ctx.stroke();
      // specular streak on the left wall
      const stk = ctx.createLinearGradient(0, RIM_Y, 0, NECK_Y);
      stk.addColorStop(0, "rgba(255,255,255,.95)");
      stk.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = stk;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(CX - RIM_W + 24, RIM_Y + 18);
      ctx.lineTo(CX - NECK_W - 6, NECK_Y - 18);
      ctx.stroke();

      // stage labels
      ctx.font = "700 11px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      GATES.forEach((g, i) => {
        const w = hw(g.y);
        ctx.strokeStyle = "rgba(35,27,24,.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(CX - w - 8, g.y);
        ctx.lineTo(CX - w - 34, g.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(35,27,24,${0.45 + gateHit[i] * 0.45})`;
        ctx.fillText(g.label, CX - w - 40, g.y + 4);
      });
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(35,27,24,${0.45 + orb * 0.4})`;
      ctx.fillText("Customers", CX + 40, ORB_Y + 4);

      // pulses (rings from the orb)
      for (const p of pulses) {
        ctx.strokeStyle = `rgba(255,138,29,${(1 - p.t) * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CX, ORB_Y, 16 + p.t * 40, 0, 6.283);
        ctx.stroke();
      }

      // orb
      const os = 1 + orb * 0.28;
      const halo = ctx.createRadialGradient(CX, ORB_Y, 4, CX, ORB_Y, 60 + orb * 30);
      halo.addColorStop(0, `rgba(255,194,51,${0.45 + orb * 0.4})`);
      halo.addColorStop(1, "rgba(255,194,51,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(CX, ORB_Y, 90, 0, 6.283);
      ctx.fill();
      ctx.save();
      ctx.translate(CX, ORB_Y);
      ctx.scale(os, os);
      const og = ctx.createRadialGradient(-5, -6, 2, 0, 0, 18);
      og.addColorStop(0, "#FFF3C4");
      og.addColorStop(0.45, "#FFC233");
      og.addColorStop(1, "#FF8A1D");
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#231B18";
      ctx.font = "800 15px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★", 0, 5.5);
      ctx.restore();
    };

    let visible = true, raf = 0, last = performance.now();
    const step = (dt: number) => {
      for (const p of parts) {
        if (p.dead) {
          p.dead += dt;
          p.y += dt * 8;
          if (p.dead > 0.6) Object.assign(p, spawn());
          continue;
        }
        const t = (p.y - 14) / (END_Y - 14);
        const prev = p.y;
        p.y += dt * p.spd * (1 + t * 0.55) * (1 - hover * 0.4);
        p.ang += dt * p.spin * (1 + (1 - hw(p.y) / RIM_W) * 2.6);
        p.trail.push({ x: xyOf(p).x, y: p.y });
        if (p.trail.length > 9) p.trail.shift();
        GATES.forEach((g, i) => {
          if (prev < g.y && p.y >= g.y) {
            gateHit[i] = Math.min(1, gateHit[i] + 0.55);
            if (p.fail === i) p.dead = 0.001;
          }
        });
        if (p.y >= END_Y) {
          coins.push({ x: xyOf(p).x, y: END_Y, t: 0 });
          Object.assign(p, spawn());
        }
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.t += dt * 2.4;
        c.x = lerp(c.x, CX, Math.min(1, dt * 7));
        c.y = lerp(END_Y, ORB_Y, c.t * c.t);
        if (c.t >= 1) {
          coins.splice(i, 1);
          orb = Math.min(1, orb + 0.28);
          if (pulses.length < 4) pulses.push({ y: 0, t: 0 });
        }
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += dt * 1.1;
        if (pulses[i].t >= 1) pulses.splice(i, 1);
      }
      orb *= Math.exp(-dt * 0.9);
      for (let i = 0; i < 3; i++) gateHit[i] *= Math.exp(-dt * 3);
    };

    const frame = (now: number) => {
      if (!visible) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      step(dt);
      render(now);
      raf = requestAnimationFrame(frame);
    };
    if (reduced) {
      for (let i = 0; i < 60; i++) step(0.05);
      render(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const enter = () => (hover = 1);
    const leave = () => (hover = 0);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    const io = new IntersectionObserver(([en]) => {
      const v = en.isIntersecting;
      if (v && !visible && !reduced) {
        last = performance.now();
        visible = true;
        raf = requestAnimationFrame(frame);
      }
      visible = v;
    });
    io.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      visible = false;
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      canvas.remove();
    };
  }, []);

  return (
    <div ref={box} className="sv bg-[radial-gradient(circle_at_50%_28%,#FFF1D2,#FFFDF7_72%)]">
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <span className="rounded-full bg-espresso px-5 py-2.5 font-hero text-[13px] font-extrabold text-sun shadow-[0_18px_30px_-14px_rgba(35,27,24,0.9)]" style={{ animation: "fn-btn 5s ease-in-out infinite" }}>
          Get started →
        </span>
      </div>
    </div>
  );
}
