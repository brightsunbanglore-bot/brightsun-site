"use client";

import { useEffect, useRef } from "react";

/**
 * "Life of a brand" scrub: one glowing ball drawn live in a WebGL shader, ten looks, thrown
 * physically whenever the timeline is scrubbed. Sits on the site's espresso background.
 * Hover or drag the timeline, drag anywhere on the card, use arrow keys; it also plays itself.
 */
const STAGES = [
  { t: "Before you start", b: "Unknown", c: "Nobody can find you yet" },
  { t: "Getting noticed", b: "First searches", c: "A few people start to find you" },
  { t: "Foundations", b: "Ignition", c: "Content and technical SEO switch on" },
  { t: "On page one", b: "Visible", c: "Customers see you when they search" },
  { t: "AI answers", b: "Cited", c: "AI tools start to mention your brand" },
  { t: "Paid reach", b: "Amplified", c: "Ad campaigns widen your reach" },
  { t: "Everywhere", b: "In demand", c: "Search, maps and social work together" },
  { t: "Customers", b: "Conversion", c: "Visitors turn into customers" },
  { t: "Loyalty", b: "Inbox", c: "Email brings them back again" },
  { t: "Lasting brand", b: "Shining", c: "A steady glow customers trust" },
];

type Look = { c0: number[]; c1: number[]; c2: number[]; glow: number[]; gI: number; freq: number; warp: number; cells: number; gas: number; shell: number; boil: number };
const LOOK: Look[] = [
  { c0: [0.05, 0.01, 0.1], c1: [0.62, 0.12, 0.42], c2: [1.9, 0.85, 0.5], glow: [0.8, 0.25, 0.6], gI: 0.22, freq: 2.6, warp: 1.9, cells: 0, gas: 1, shell: 0, boil: 1 },
  { c0: [0.015, 0.004, 0], c1: [0.62, 0.05, 0.01], c2: [3, 1.1, 0.15], glow: [1.3, 0.2, 0.04], gI: 0.28, freq: 3.1, warp: 1.2, cells: 1, gas: 0, shell: 0, boil: 0.7 },
  { c0: [0.5, 0.05, 0], c1: [1.7, 0.48, 0.03], c2: [3.2, 2, 0.55], glow: [1.6, 0.5, 0.06], gI: 0.85, freq: 4.6, warp: 1.6, cells: 0.3, gas: 0, shell: 0, boil: 1.5 },
  { c0: [1, 0.26, 0.01], c1: [2.3, 1, 0.12], c2: [3.6, 2.9, 1.3], glow: [1.8, 0.68, 0.1], gI: 1, freq: 3.4, warp: 1.1, cells: 0, gas: 0, shell: 0, boil: 1.1 },
  { c0: [1.5, 0.72, 0.2], c1: [3, 2.1, 0.8], c2: [4.6, 4.3, 3.4], glow: [1.9, 1.2, 0.5], gI: 1.2, freq: 3.8, warp: 1.1, cells: 0, gas: 0, shell: 0, boil: 1.3 },
  { c0: [0.6, 0.1, 0.005], c1: [1.8, 0.5, 0.03], c2: [3, 1.5, 0.25], glow: [1.7, 0.42, 0.05], gI: 0.9, freq: 3, warp: 1.6, cells: 0.15, gas: 0, shell: 0, boil: 1.2 },
  { c0: [0.22, 0.008, 0.003], c1: [1.25, 0.1, 0.015], c2: [3, 0.95, 0.1], glow: [1.8, 0.16, 0.03], gI: 0.85, freq: 2, warp: 2.1, cells: 0.35, gas: 0, shell: 0, boil: 1.4 },
  { c0: [1.6, 0.8, 0.3], c1: [4, 3, 1.4], c2: [8, 7, 5.5], glow: [2.4, 1.6, 0.8], gI: 1.7, freq: 3.2, warp: 2, cells: 0, gas: 0, shell: 0, boil: 3 },
  { c0: [0.02, 0.09, 0.12], c1: [0.1, 0.7, 0.72], c2: [1.8, 0.42, 0.16], glow: [0.3, 0.7, 0.8], gI: 0.3, freq: 3.4, warp: 1.5, cells: 0, gas: 0.75, shell: 1, boil: 0.9 },
  { c0: [0.8, 1, 1.5], c1: [1.7, 2.1, 3], c2: [3.6, 4.2, 5.4], glow: [0.8, 1.2, 2.1], gI: 0.9, freq: 2.6, warp: 0.8, cells: 0, gas: 0, shell: 0, boil: 0.5 },
];
const LAST = STAGES.length - 1;
const PER = 4;
const N = LAST * PER + 1;
const START = 3;

// site espresso (#231B18) pre-inverted through the shader's tone-map so the page colour is exact
const BG = [35, 27, 24].map((v) => {
  const lin = Math.pow(v / 255, 2.2);
  return -Math.log(1 - lin) / 1.15;
});

const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
const FS = `precision highp float;
uniform vec2 res;
uniform float sc, rad, cy, t, evo, rot, blur, starX, freq, warp, cells, gas, shell, gI, flick;
uniform vec3 c0, c1, c2, glow, bg;
float h(vec3 p){ p = fract(p*.3183099 + .1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
  return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
vec3 stars(vec2 uv){
  vec2 q = (uv + vec2(starX, 0.))*34., id = floor(q), f = fract(q)-.5;
  float r = fract(sin(dot(id,vec2(127.1,311.7)))*43758.5453);
  vec2 o = vec2(fract(r*17.3),fract(r*91.7))-.5;
  float tw = .55+.45*sin(t*(.7+r*1.8)+r*40.);
  vec2 g = f-o*.7; g.x *= 1./(1.+blur*7.);
  return vec3(smoothstep(.975,1.,r)*smoothstep(.06,.0,length(g))*tw*.55);
}
void main(){
  vec2 uv = (gl_FragCoord.xy - .5*res)/res.y, p = (uv - vec2(0., cy))/sc;
  float d = length(p), e = max(d-rad, 0.);
  vec3 col = bg + stars(uv)*.8;
  vec2 dir = p/max(d,1e-4);
  if(e < rad*.6){
    float rays = .72 + .56*fbm(vec3(dir*2.4, evo*.5));
    float hal = exp(-e/(rad*.11))*smoothstep(rad*.6, rad*.12, e);
    col += glow*gI*.7*hal*rays*flick;
  }
  float py = (p.y + rad + .065)/.0135, px = p.x/(rad*1.02);
  float pool = max(0., 1.-px*px) * exp(-py*py);
  col += glow*min(gI,1.)*.1*pool*pool;
  if(d < rad + .02){
    float k = min(d/rad, 1.);
    vec3 nrm = vec3(p/rad, sqrt(max(1.-k*k, 0.)));
    float cr = cos(rot), sr = sin(rot);
    vec3 n = vec3(nrm.x*cr + nrm.z*sr, nrm.y, -nrm.x*sr + nrm.z*cr);
    float sq = 1./(1.+blur*3.2);
    vec3 q = vec3(n.x*sq, n.y, n.z*sq);
    float w1 = fbm(q*freq + vec3(0.,0.,evo*.28)), w2 = fbm(q*freq*.9 + 7. - vec3(evo*.22,0.,0.));
    float v = fbm(q*freq*1.7 + warp*2.2*vec3(w1, w2, w1-w2));
    float vein = 1.-abs(2.*fbm(q*freq*1.5 + warp*1.3*vec3(w2, w1, 0.))-1.);
    vein = pow(vein, 9.);
    float s = smoothstep(.24,.76,v);
    s = mix(s, clamp(vein*1.25 + s*.14,0.,1.), cells);
    vec3 c = mix(c0, c1, smoothstep(.0,.55,s));
    c = mix(c, c2, smoothstep(.5,1.,s));
    float mu = nrm.z;
    if(shell > .001){
      vec3 sh = c0 + c1*smoothstep(.95,.3,k)*(.25+v*1.2);
      float fil = smoothstep(.5,.82,k)*smoothstep(1.,.8,k)*pow(v+.32,3.)*3.2;
      sh += c2*fil + vec3(3.5,4.,5.)*exp(-k*k/.012);
      c = mix(c, sh, shell);
    } else {
      c *= mix(mix(.34, .8, gas), 1., pow(mu,.5));
    }
    c += glow*pow(1.-mu,2.6)*.42*min(gI,1.)*(1.-gas);
    float edge = smoothstep(1., .985, k);
    float soft = smoothstep(1., .58, k + (fbm(q*3.4 + evo*.1)-.5)*.62) * smoothstep(1., .9, k);
    float a = mix(edge, soft, gas);
    col = mix(col, c, a);
  }
  col = 1. - exp(-col*1.15);
  gl_FragColor = vec4(pow(col, vec3(.4545)), 1.);
}`;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function SunScrub() {
  const box = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ticksEl = useRef<HTMLDivElement>(null);
  const e0 = useRef<HTMLSpanElement>(null);
  const e1 = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = box.current, capEl = cap.current, trackEl = track.current, ticksHost = ticksEl.current;
    if (!root || !capEl || !trackEl || !ticksHost) return;
    // fresh canvas per effect run (React strict mode runs effects twice in dev; a context that
    // was released on the first run must never be reused)
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0";
    root.insertBefore(canvas, root.firstChild);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      canvas.remove();
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U: Record<string, WebGLUniformLocation | null> = {};
    "res sc rad cy t evo rot blur starX freq warp cells gas shell gI flick c0 c1 c2 glow bg".split(" ").forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    gl.uniform1f(U.rad, 0.17);
    gl.uniform1f(U.cy, 0.13);
    gl.uniform3f(U.bg, BG[0], BG[1], BG[2]);

    let visible = true;
    let raf = 0;
    let W = 1, H = 1;
    const resize = () => {
      const r = root.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      // cap the backing size: the shader is heavy, a huge canvas can crash the GPU process
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5, 820 / Math.max(W, H));
      canvas.width = Math.max(2, Math.round(W * dpr));
      canvas.height = Math.max(2, Math.round(H * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.sc, Math.min(1, (W / H) * 1.5));
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      visible = false;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    // ticks
    ticksHost.innerHTML = "";
    const ticks: HTMLElement[] = [];
    const tickH: number[] = [];
    for (let j = 0; j < N; j++) {
      const i = document.createElement("i");
      ticksHost.appendChild(i);
      ticks.push(i);
      tickH.push(0.2);
    }

    let x = START / LAST;
    let stage = START;
    let omega = 14;
    let rot = 0, evo = 0, starX = 0, lastInput = -1e9, hover = -1;
    let dragX: number | null = null, dragOnTrack = false;
    const cur: Look = JSON.parse(JSON.stringify(LOOK[START]));
    const t0 = performance.now();
    let nextAuto = t0 + 5000;

    const setCaption = (i: number) => {
      const s = STAGES[i];
      const old = capEl.querySelector<HTMLElement>(".sl:not(.off)");
      const el = document.createElement("div");
      el.className = "sl off";
      el.innerHTML = `<h4>${s.t}</h4><p><b>${s.b}</b>${s.c}</p>`;
      capEl.appendChild(el);
      void el.offsetWidth;
      el.classList.remove("off");
      if (old) {
        old.classList.add("off");
        setTimeout(() => old.remove(), 240);
      }
      trackEl.setAttribute("aria-valuenow", String(i));
      trackEl.setAttribute("aria-valuetext", `${s.t}: ${s.b}`);
      e0.current?.classList.toggle("on", i === 0);
      e1.current?.classList.toggle("on", i === LAST);
    };
    capEl.innerHTML = "";
    setCaption(START);

    const moveTo = (nx: number, now: number) => {
      nx = clamp(nx, 0, 1);
      omega += (nx - x) * 150;
      x = nx;
      lastInput = now;
    };
    const px = (e: PointerEvent) => {
      const r = trackEl.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1);
    };

    const onTrackMove = (e: PointerEvent) => {
      hover = px(e);
      if (e.pointerType === "mouse" && dragX === null) moveTo(hover, performance.now());
    };
    const onTrackLeave = () => (hover = -1);
    const onDown = (e: PointerEvent) => {
      dragX = e.clientX;
      dragOnTrack = trackEl.contains(e.target as Node);
      if (dragOnTrack) moveTo(px(e), performance.now());
    };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      if (dragOnTrack) moveTo(px(e), performance.now());
      else {
        const dx = e.clientX - dragX;
        dragX = e.clientX;
        moveTo(x + dx / Math.min(W, 520), performance.now());
      }
    };
    const onUp = () => (dragX = null);
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      moveTo((clamp(stage + dir, 0, LAST)) / LAST, performance.now());
    };
    trackEl.addEventListener("pointermove", onTrackMove);
    trackEl.addEventListener("pointerleave", onTrackLeave);
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    trackEl.addEventListener("keydown", onKey);

    const io = new IntersectionObserver(
      ([en]) => {
        const v = en.isIntersecting;
        if (v && !visible) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
        visible = v;
      },
      { threshold: 0.05 },
    );
    io.observe(root);

    let last = t0;
    const keys = ["freq", "warp", "cells", "gas", "shell", "gI", "boil"] as const;
    const frame = (now: number) => {
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const f = (r: number) => 1 - Math.exp(-dt * r);
      const time = (now - t0) / 1000;

      if (!reduced && now - lastInput > 5000 && now > nextAuto) {
        const i = Math.round(x * LAST);
        x = ((i + 1) % (LAST + 1)) / LAST;
        omega += 9;
        nextAuto = now + 2600;
      }
      const i = Math.round(x * LAST);
      if (i !== stage) {
        omega += omega >= 0 ? 7 : -7;
        stage = i;
        setCaption(i);
      }
      const L = LOOK[stage];
      const ef = f(reduced ? 60 : 13);
      keys.forEach((k) => (cur[k] += (L[k] - cur[k]) * ef));
      (["c0", "c1", "c2", "glow"] as const).forEach((k) => {
        for (let m = 0; m < 3; m++) cur[k][m] += (L[k][m] - cur[k][m]) * ef;
      });
      omega *= Math.exp(-dt * 3.6);
      const spin = reduced ? 0 : 0.22 + omega;
      const blur = Math.min(1.4, Math.abs(omega) * 0.1);
      rot += spin * dt;
      evo += dt * cur.boil * (1 + Math.abs(omega) * 0.1);
      starX += omega * dt * 0.012;

      gl.uniform1f(U.freq, cur.freq);
      gl.uniform1f(U.warp, cur.warp);
      gl.uniform1f(U.cells, cur.cells);
      gl.uniform1f(U.gas, cur.gas);
      gl.uniform1f(U.shell, cur.shell);
      gl.uniform1f(U.gI, cur.gI);
      gl.uniform3f(U.c0, cur.c0[0], cur.c0[1], cur.c0[2]);
      gl.uniform3f(U.c1, cur.c1[0], cur.c1[1], cur.c1[2]);
      gl.uniform3f(U.c2, cur.c2[0], cur.c2[1], cur.c2[2]);
      gl.uniform3f(U.glow, cur.glow[0], cur.glow[1], cur.glow[2]);
      gl.uniform1f(U.t, time);
      gl.uniform1f(U.evo, evo);
      gl.uniform1f(U.rot, rot);
      gl.uniform1f(U.blur, blur);
      gl.uniform1f(U.starX, starX);
      gl.uniform1f(U.flick, 1 + 0.1 * Math.sin(time * 2.1) + 0.06 * Math.sin(time * 5.3));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.style.opacity = String(Math.min(1, (now - t0) / 500));

      const active = x * (N - 1);
      const bellAt = (hover >= 0 ? hover : x) * (N - 1);
      const tf = f(22);
      for (let j = 0; j < N; j++) {
        const q = j - bellAt;
        const bell = Math.exp((-q * q) / 5.5);
        const on = Math.exp((-(j - active) * (j - active)) / 0.22);
        const goal = Math.max((j % PER ? 0.17 : 0.28) + bell * 0.55, on);
        tickH[j] += (goal - tickH[j]) * tf;
        ticks[j].style.transform = `scaleY(${tickH[j].toFixed(3)})`;
        ticks[j].style.opacity = (0.3 + bell * 0.35 + on * 0.6).toFixed(3);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      visible = false;
      canvas.removeEventListener("webglcontextlost", onLost);
      ro.disconnect();
      io.disconnect();
      trackEl.removeEventListener("pointermove", onTrackMove);
      trackEl.removeEventListener("pointerleave", onTrackLeave);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      trackEl.removeEventListener("keydown", onKey);
      canvas.remove();
    };
  }, []);

  return (
    <div ref={box} className="sv sunscrub" style={{ background: "#231B18", touchAction: "pan-y", cursor: "grab" }}>
      <style>{`
.sunscrub canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sunscrub .ui{position:absolute;left:0;right:0;top:62%;display:grid;justify-items:center;padding:0 16px;pointer-events:none;color:#fff}
.sunscrub .cap{position:relative;width:100%;height:50px}
.sunscrub .sl{position:absolute;inset:0;text-align:center;transition:opacity .2s linear,filter .2s linear}
.sunscrub .sl.off{opacity:0;filter:blur(5px)}
.sunscrub .sl h4{font-weight:600;font-size:15px;letter-spacing:-.012em;line-height:1.25;margin:0}
.sunscrub .sl p{margin:5px 0 0;font-size:12px;line-height:1.3;color:rgba(255,255,255,.55)}
.sunscrub .sl p b{font-weight:600;color:#fff;margin-right:7px}
.sunscrub .trk{position:relative;width:min(240px,74%);height:56px;margin-top:10px;pointer-events:auto;cursor:pointer;outline:none;touch-action:none}
.sunscrub .trk::before{content:"";position:absolute;inset:-8px -30px}
.sunscrub .tk{position:absolute;left:0;right:0;top:0;height:34px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}
.sunscrub .tk i{display:block;width:1.5px;height:34px;background:#fff;transform-origin:50% 100%;will-change:transform}
.sunscrub .ends{position:absolute;left:0;right:0;top:42px;display:flex;justify-content:space-between;font-size:11.5px;color:rgba(255,255,255,.45);pointer-events:none}
.sunscrub .ends span.on{color:#fff;font-weight:600}
`}</style>
      <div className="ui">
        <div className="cap" ref={cap} aria-live="polite" />
        <div className="trk" ref={track} role="slider" tabIndex={0} aria-label="Brand journey" aria-valuemin={0} aria-valuemax={LAST}>
          <div className="tk" ref={ticksEl} />
          <div className="ends">
            <span ref={e0}>Unknown</span>
            <span ref={e1}>Shining</span>
          </div>
        </div>
      </div>
    </div>
  );
}
