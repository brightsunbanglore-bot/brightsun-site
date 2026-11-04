"use client";

import { useEffect, useRef } from "react";

/**
 * LivingPortrait: a photo-like head on a soft stretchy sheet (WebGL).
 * It needs one picture (`rest`). Every extra picture in `faces` unlocks more:
 * gaze directions, blinks, expressions, hair colours and the idle acts. Missing
 * pictures are simply skipped, so a single photo already gives the stretchy skin,
 * the lean toward the cursor and the shake / pull reactions.
 *
 * Only ONE picture is ever on screen (70ms crossfade at most), and the sheet is
 * re-ordered every frame so it can squash but never fold.
 */
export type PortraitFaces = { rest: string } & Partial<Record<string, string>>;

type Props = {
  faces: PortraitFaces;
  alt: string;
  className?: string;
  /** "oval" softly masks an ordinary photo; "none" for cut-out PNGs with a transparent background. */
  mask?: "oval" | "none";
};

const RING = ["e", "ene", "ne", "nne", "n", "nnw", "nw", "wnw", "w", "wsw", "sw", "ssw", "s", "sse", "se", "ese"];
const EYEFILE: Record<string, string> = { e: "right", ene: "ene", ne: "upright", nne: "nne", n: "up", nnw: "nnw", nw: "wnw", wnw: "wnw", w: "left", wsw: "wsw", sw: "downleft", ssw: "ssw", s: "down", sse: "sse", se: "downright", ese: "ese", half: "half", closed: "closed" };
const HAIRS = ["pink", "blue", "blonde"];

const OVER = 1.7, N = 72, M = N + 1, SPAN = OVER / N, ORIGIN = 0.5 - OVER / 2;
const WOBBLE = 2.3 * 2 * Math.PI, REACH = 0.085 / SPAN, C = REACH * WOBBLE, GAMMA = 2 * 0.14 * WOBBLE, NU = 0.2 * C;

type Step = [string, number, number, Record<string, any>?];
const ACTS: Record<string, Step[] | "fly" | "tug" | "hair"> = {
  yawn: [["yawn1", 140, 240], ["yawn2", 140, 200], ["yawn", 170, 900], ["yawn2", 150, 130], ["yawn4", 180, 700]],
  whistle: [["whistle1", 150, 700], ["whistle2", 100, 700], ["whistle1", 100, 620], ["whistle2", 100, 620]],
  shifty: [["eye:w", 60, 520], ["eye:e", 60, 600], ["eye:w", 60, 400], ["eye:rest", 60, 260]],
  roll: [["eye:w", 70, 200], ["eye:wnw", 50, 55], ["eye:nw", 50, 55], ["eye:nnw", 50, 60], ["eye:n", 50, 140], ["eye:nne", 50, 60], ["eye:ne", 50, 55], ["eye:ene", 50, 55], ["eye:e", 50, 240], ["eye:rest", 90, 200], ["deadpan", 120, 700]],
  sneeze: [["sneeze1", 130, 380], ["half", 90, 120], ["sneeze1", 90, 560], ["sneeze2", 50, 300, { jolt: [0.5, 0.6, 0, 1.5, 0.34], lean: [0, 0.03] }], ["dizzy", 110, 620], ["shy", 140, 650]],
  gum: [["gum1", 130, 800], ["gum2", 180, 460], ["gum3", 200, 760], ["gumpop", 40, 1300, { jolt: [0.5, 0.63, 0, -1.1, 0.3] }], ["deadpan", 200, 700], ["laugh", 130, 700]],
  doze: [["half", 450, 700, { lean: [0.006, 0.006] }], ["closed", 320, 500, { lean: [0.012, 0.012] }], ["half", 200, 340], ["closed", 400, 1100, { lean: [0.02, 0.02] }], ["snore", 260, 3400, { lean: [0.03, 0.03] }], ["shock", 50, 650, { jolt: [0.5, 0.5, 0, -0.9, 0.3] }]],
  flirt: [["smug", 130, 520], ["winkr", 80, 420], ["kiss", 120, 560], ["hearts", 120, 900], ["shy", 160, 620]],
  cheeky: [["winkl", 90, 340], ["tongue", 110, 900], ["grin", 120, 620]],
  cross: [["cross", 140, 800], ["fish", 130, 800], ["puff", 120, 700, { jolt: [0.5, 0.6, 0, -0.25, 0.3] }], ["laugh", 90, 800]],
  sad: [["raised", 140, 500], ["cry", 240, 1500], ["shy", 200, 520]],
  wow: [["stars", 130, 1000], ["grin", 140, 640]],
  fly: "fly", tug: "tug", hair: "hair",
};
const ROTATION = ["yawn", "shifty", "gum", "fly", "flirt", "roll", "sneeze", "hair", "tug", "cross", "whistle", "doze", "cheeky", "wow", "sad"];
const NEEDS: Record<string, string[]> = { fly: ["cross", "whistle1", "whistle2", "deadpan", "smug"], tug: ["shock", "ouch", "dizzy", "angry"], hair: ["pink", "blue", "blonde"] };
const SPOT = { nose: [0.5, 0.54], cheekR: [0.66, 0.57] };
const ZONES = {
  hover: { eyeL: "winkl", eyeR: "winkr", nose: "cross", mouth: "kiss" } as Record<string, string>,
  tap: { brow: "angry", eyeL: "ouch", eyeR: "ouch", nose: "act:sneeze", mouth: "tongue", cheek: "puff", chin: "laugh" } as Record<string, string>,
};
const zoneAt = (u: number, v: number) => {
  const a = (u - 0.505) / 0.225, b = (v - 0.485) / 0.33;
  if (a * a + b * b > 1 || v < 0.23) return "hair";
  if (v < 0.385) return "brow";
  if (Math.abs(v - 0.455) < 0.05 && u > 0.33 && u < 0.455) return "eyeL";
  if (Math.abs(v - 0.455) < 0.05 && u > 0.545 && u < 0.67) return "eyeR";
  if (Math.abs(u - 0.5) < 0.055 && v < 0.6) return "nose";
  if (v > 0.6 && v < 0.71 && Math.abs(u - 0.5) < 0.1) return "mouth";
  return v > 0.71 ? "chin" : "cheek";
};

const VS = `attribute vec2 a, d; attribute float s; varying vec2 vUv; varying float vS;
  uniform vec2 lean; uniform float overS;
  void main(){ vUv = a; vS = s; vec2 p = a + d + lean; gl_Position = vec4(vec2(p.x-.5, .5-p.y)*2./overS, 0., 1.); }`;
const FS = `precision highp float; varying vec2 vUv; varying float vS;
  uniform sampler2D faceA, faceB; uniform float fade; uniform float oval;
  void main(){
    if(vUv.x<0.||vUv.y<0.||vUv.x>1.||vUv.y>1.){ gl_FragColor = vec4(0.); return; }
    vec4 c = mix(texture2D(faceA,vUv), texture2D(faceB,vUv), fade);
    if(oval>.5){ vec2 q=(vUv-vec2(.5,.47))/vec2(.5,.5); float m=1.-smoothstep(.78,1.0,length(q)); c*=m; }
    if(c.a<.004){ gl_FragColor = vec4(0.); return; }
    gl_FragColor = vec4(c.rgb*vS, c.a);
  }`;

export function LivingPortrait({ faces, alt, className = "", mask = "oval" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const fallback = useRef<HTMLImageElement>(null);
  const flyEl = useRef<SVGSVGElement>(null);
  const handEl = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const wrap = box.current, props = layer.current, fb = fallback.current, fly = flyEl.current, hand = handEl.current;
    if (!wrap || !props || !fb || !fly || !hand) return;

    // a fresh canvas per run keeps React StrictMode (dev double-mount) safe
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;left:-35%;top:-35%;width:170%;height:170%;pointer-events:none";
    props.parentElement!.insertBefore(canvas, props);
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) { canvas.remove(); return; }
    let dead = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    const U: Record<string, WebGLUniformLocation | null> = {};
    for (const n of ["lean", "faceA", "faceB", "fade", "overS", "oval"]) U[n] = gl.getUniformLocation(pr, n);
    gl.uniform1f(U.overS, OVER); gl.uniform1f(U.oval, mask === "oval" ? 1 : 0);
    gl.uniform1i(U.faceA, 0); gl.uniform1i(U.faceB, 1);

    const count = M * M;
    const ux = new Float32Array(count), uy = new Float32Array(count), vx = new Float32Array(count), vy = new Float32Array(count);
    const rest = new Float32Array(count * 2), dyn = new Float32Array(count * 3);
    const sx = new Float32Array(count), sy = new Float32Array(count);
    for (let j = 0, k = 0; j < M; j++) for (let i = 0; i < M; i++) { rest[k++] = ORIGIN + i * SPAN; rest[k++] = ORIGIN + j * SPAN; }
    const idx = new Uint16Array(N * N * 6);
    for (let j = 0, k = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * M + i, b = a + 1, c = a + M, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, rest, gl.STATIC_DRAW);
    const aa = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(aa); gl.vertexAttribPointer(aa, 2, gl.FLOAT, false, 0, 0);
    const dynBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf); gl.bufferData(gl.ARRAY_BUFFER, dyn, gl.DYNAMIC_DRAW);
    const ad = gl.getAttribLocation(pr, "d"), as = gl.getAttribLocation(pr, "s");
    gl.enableVertexAttribArray(ad); gl.vertexAttribPointer(ad, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(as); gl.vertexAttribPointer(as, 1, gl.FLOAT, false, 12, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);

    let brush: { u: number; v: number; list: number[][]; px: number; py: number } | null = null;
    function takeHold(u: number, v: number, radius = 0.22) {
      const list: number[][] = [];
      for (let k = 0; k < count; k++) {
        const dx = rest[k * 2] + ux[k] - u, dy = rest[k * 2 + 1] + uy[k] - v, w = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
        if (w > 0.02) list.push([k, w, ux[k], uy[k]]);
      }
      brush = { u, v, list, px: 0, py: 0 };
    }
    const GAP = SPAN * 0.34, lineA = new Float32Array(M), lineB = new Float32Array(M), lineP = new Float32Array(M);
    function order(start: number, stride: number, field: Float32Array, base: Float32Array) {
      for (let i = 0; i < M; i++) { const k = start + i * stride; lineP[i] = base[k] + field[k]; }
      lineA[0] = lineP[0]; for (let i = 1; i < M; i++) lineA[i] = Math.max(lineP[i], lineA[i - 1] + GAP);
      lineB[N] = lineP[N]; for (let i = N - 1; i >= 0; i--) lineB[i] = Math.min(lineP[i], lineB[i + 1] - GAP);
      for (let i = 0; i < M; i++) { const k = start + i * stride; field[k] = (lineA[i] + lineB[i]) / 2 - base[k]; }
    }
    const restX = new Float32Array(count), restY = new Float32Array(count);
    for (let k = 0; k < count; k++) { restX[k] = rest[k * 2]; restY[k] = rest[k * 2 + 1]; }
    function untangle() {
      for (let pass = 0; pass < 2; pass++) {
        for (let j = 0; j < M; j++) order(j * M, 1, sx, restX);
        for (let i = 0; i < M; i++) order(i, M, sy, restY);
      }
    }
    const H = 1 / 240; let simLeft = 0;
    function step(dt: number) {
      const c2 = C * C, wo2 = WOBBLE * WOBBLE;
      for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
        const k = j * M + i, l = k - 1, r = k + 1, t = k - M, b = k + M;
        const lx = ux[l] + ux[r] + ux[t] + ux[b] - 4 * ux[k], ly = uy[l] + uy[r] + uy[t] + uy[b] - 4 * uy[k];
        const lvx = vx[l] + vx[r] + vx[t] + vx[b] - 4 * vx[k], lvy = vy[l] + vy[r] + vy[t] + vy[b] - 4 * vy[k];
        vx[k] += (c2 * lx - wo2 * ux[k] - GAMMA * vx[k] + NU * lvx) * dt;
        vy[k] += (c2 * ly - wo2 * uy[k] - GAMMA * vy[k] + NU * lvy) * dt;
      }
      if (brush) for (const [k, w, u0, v0] of brush.list) {
        const K = 3000 * w, D = 90 * w;
        vx[k] += ((u0 + brush.px * w - ux[k]) * K - vx[k] * D) * dt;
        vy[k] += ((v0 + brush.py * w - uy[k]) * K - vy[k] * D) * dt;
      }
      for (let k = 0; k < count; k++) { ux[k] += vx[k] * dt; uy[k] += vy[k] * dt; }
    }
    function poke(u: number, v: number, dx: number, dy: number, radius = 0.09) {
      for (let k = 0; k < count; k++) {
        const ax = rest[k * 2] - u, ay = rest[k * 2 + 1] - v, w = Math.exp(-(ax * ax + ay * ay) / (radius * radius));
        vx[k] += dx * w; vy[k] += dy * w;
      }
    }

    // ---- pictures ----
    const tex: Record<string, WebGLTexture> = {};
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const load = (name: string) => new Promise<HTMLImageElement | null>((res) => {
      const src = (faces as Record<string, string | undefined>)[name];
      if (!src) return res(null);
      const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
    });
    function upload(name: string, img: HTMLImageElement) {
      const t = gl!.createTexture()!; gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, t);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      tex[name] = t;
    }
    let alphaMap: Uint8ClampedArray | null = null;
    function hitMap(img: HTMLImageElement) {
      const a = document.createElement("canvas"); a.width = a.height = 128;
      const ac = a.getContext("2d", { willReadFrequently: true })!; ac.drawImage(img, 0, 0, 128, 128);
      alphaMap = ac.getImageData(0, 0, 128, 128).data;
    }

    // ---- state ----
    let ready = false, tStart = 0, last = performance.now();
    let pu = 0.5, pv = 0.5, onHead = false, zone: string | null = null, zoneSince = 0;
    let lastInput = -1e9, awake = false, pressed = false, downAt = 0, downU = 0, downV = 0, lastX = 0, lastY = 0, speed = 0, shake = 0;
    let moodFace: string | null = null, moodUntil = 0, pulls: number[] = [], lookAt: (() => number[]) | null = null;
    let act: Step[] | null = null, actI = 0, actT = 0, rotation: string[] = [], nextIdle = 30000;
    let faceA = "rest", faceB = "rest", fadeT = 0, fadeMs = 1;
    let logical = "rest", logicalMs = 70, eyeNow = "rest", eyeNowMs = 40;
    let nextBlink = 0, blinkStep = -1, blinkT = 0;
    let leanX = 0, leanY = 0, lvX = 0, lvY = 0, wantLean = [0, 0];
    let hairI = -1, wantEyes: string | null = null, handHeld = false, handGrip: string | false = false;
    let handFrom = [1.4, 0.9], handTo = [1.4, 0.9], flyFrom = [1.4, 0], flyTo = [1.4, 0], moveT = 0, moveMs = 1;
    let flyPos = [1.4, 0], visible = true, scrollUntil = 0, lastScroll = scrollY;

    const fileOf = (cell: string) => (cell === "rest" ? "rest" : EYEFILE[cell]);
    const setFace = (n: string, ms: number) => { logical = n; logicalMs = ms; };
    const setEye = (cell: string, ms: number) => { const f = fileOf(cell); if (f && tex[f]) { eyeNow = cell; eyeNowMs = ms; } };
    const have = (n: string) => !!tex[n];
    function show(n: string, ms: number, now: number) {
      if (!tex[n] || n === faceB) return;
      faceA = (now - fadeT) / fadeMs > 0.5 ? faceB : faceA; faceB = n; fadeT = now; fadeMs = Math.min(70, Math.max(1, ms));
    }
    function compose(now: number) {
      if (logical !== "rest" && tex[logical]) show(logical, logicalMs, now);
      else if (hairI >= 0) show(HAIRS[hairI], 70, now);
      else show(fileOf(eyeNow) || "rest", eyeNowMs, now);
    }
    const ringFor = (dx: number, dy: number) => RING[Math.round(((Math.atan2(-dy, dx) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 8)) % 16];
    const place = (el: SVGElement, u: number, v: number) => { el.style.left = ((u - 0.5) * 100 + 50) + "%"; el.style.top = ((v - 0.5) * 100 + 50) + "%"; };
    const moveHand = (u: number, v: number, ms: number) => (now: number) => { handFrom = handTo; handTo = [u, v]; moveT = now; moveMs = ms; };
    const moveFly = (u: number, v: number, ms: number) => (now: number) => { flyFrom = flyTo; flyTo = [u, v]; moveT = now; moveMs = ms; };

    function flyAct(): Step[] {
      flyTo = [1.35, 0.02]; fly!.style.opacity = "1"; lookAt = () => flyPos;
      const hop = (u: number, v: number, ms: number): Step => ["rest", 40, ms, { call: moveFly(u, v, ms * 0.9) }];
      return [hop(0.92, 0.2, 620), hop(0.1, 0.32, 680), hop(0.9, 0.66, 640), hop(0.16, 0.62, 600), hop(SPOT.nose[0], SPOT.nose[1], 520),
        ["cross", 110, 950, { jolt: [0.5, 0.54, 0, 0.28, 0.05] }],
        ["whistle1", 90, 340, { call: moveFly(0.5, 0.3, 280) }], ["deadpan", 110, 480, { call: moveFly(SPOT.nose[0], SPOT.nose[1], 320) }],
        ["cross", 90, 560, { jolt: [0.5, 0.54, 0, 0.28, 0.05] }],
        ["whistle2", 90, 620, { call: moveFly(1.5, -0.35, 600) }], ["smug", 120, 600]];
    }
    function tugAct(): Step[] {
      handTo = [1.3, 0.86]; hand!.style.opacity = "1"; hand!.classList.remove("shut");
      const g = (u: number, v: number, ms: number, face: string, grip: string | false): Step => [face, 90, ms, { call: (now: number) => { moveHand(u, v, ms * 0.8)(now); handGrip = grip; } }];
      return [g(SPOT.cheekR[0], SPOT.cheekR[1], 760, "eye:se", false), g(SPOT.cheekR[0], SPOT.cheekR[1], 240, "shock", "on"),
        g(0.95, 0.5, 620, "ouch", "pull"), g(0.86, 0.56, 240, "ouch", "pull"), g(0.98, 0.48, 240, "ouch", "pull"), g(0.9, 0.52, 260, "ouch", "pull"),
        g(1.4, 0.22, 1000, "dizzy", "off"), ["angry", 120, 620]];
    }
    const hairAct = (): Step[] => [["pink", 70, 950], ["blue", 70, 850], ["blonde", 70, 950], ["rest", 70, 200]];

    function actReady(name: string) {
      const a = ACTS[name];
      const need = typeof a === "string" ? NEEDS[a] : a.map((x) => x[0]).filter((x) => !x.startsWith("eye:") && x !== "rest");
      return need.every(have);
    }
    function endAct() {
      act = null; fly!.style.opacity = "0"; hand!.style.opacity = "0"; lookAt = null; wantEyes = null; wantLean = [0, 0];
      if (handHeld) { handHeld = false; brush = null; }
    }
    function advance(now: number) {
      actI++;
      if (!act || actI >= act.length) { endAct(); return; }
      const [shw, fade, , x] = act[actI]; actT = now;
      if (shw.startsWith("eye:")) { setFace("rest", fade); setEye(shw.slice(4), fade); wantEyes = shw.slice(4); }
      else if (shw === "half" || shw === "closed") { setFace("rest", fade); setEye(shw, fade); wantEyes = shw; }
      else { wantEyes = null; setFace(shw, fade); }
      if (x) {
        if (x.jolt) poke(x.jolt[0], x.jolt[1], x.jolt[2], x.jolt[3], x.jolt[4]);
        wantLean = x.lean || [0, 0];
        if (x.call) x.call(now);
      } else wantLean = [0, 0];
    }
    function startAct(name: string, now: number) {
      endAct();
      const a = ACTS[name];
      act = a === "fly" ? flyAct() : a === "tug" ? tugAct() : a === "hair" ? hairAct() : a;
      actI = -1; actT = now; advance(now);
    }

    // ---- input ----
    const toUv = (x: number, y: number) => { const r = canvas.getBoundingClientRect(); return [((x - r.left) / r.width - 0.5) * OVER + 0.5, ((y - r.top) / r.height - 0.5) * OVER + 0.5]; };
    const solid = (u: number, v: number) => {
      if (u < 0 || v < 0 || u >= 1 || v >= 1) return false;
      if (mask === "oval") { const a = (u - 0.5) / 0.46, b = (v - 0.47) / 0.46; return a * a + b * b < 1; }
      return !!alphaMap && alphaMap[((v * 128 | 0) * 128 + (u * 128 | 0)) * 4 + 3] > 40;
    };
    function wake(now: number) {
      lastInput = now;
      if (!awake) { awake = true; nextBlink = now + 1600; setEye("half", 90); setTimeout(() => awake && setEye("rest", 100), 110); }
      nextIdle = 30000 + Math.random() * 15000;
    }
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      [pu, pv] = toUv(e.clientX, e.clientY);
      speed += Math.hypot(dx, dy) * 0.004;
      wake(now);
      if (act && !pressed) { if (act === ACTS.doze) { actI = act.length - 2; advance(now); } else endAct(); }
      onHead = solid(pu, pv);
      const z = onHead ? zoneAt(pu, pv) : null;
      if (z !== zone) { zone = z; zoneSince = now; }
      wrap.style.cursor = pressed ? "grabbing" : onHead ? "grab" : "";
      if (onHead && !pressed) poke(pu, pv, dx * 0.00035, dy * 0.00035, 0.07);
      if (pressed && brush) {
        let px = pu - brush.u, py = pv - brush.v; const L = Math.hypot(px, py), lim = 0.24;
        if (L > 0) { const k = lim * (1 - Math.exp(-L / lim)) / L; px *= k; py *= k; }
        brush.px = px; brush.py = py;
      }
    };
    const onDown = (e: PointerEvent) => {
      const now = performance.now(), [u, v] = toUv(e.clientX, e.clientY);
      if (!solid(u, v)) return;
      wake(now); endAct(); pressed = true; downAt = now; downU = u; downV = v; takeHold(u, v);
      moodFace = null; try { wrap.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    };
    const release = () => {
      if (!pressed || !brush) { pressed = false; return; }
      const now = performance.now(), L = Math.hypot(brush.px, brush.py), z = zoneAt(downU, downV), held = now - downAt;
      pressed = false; brush = null; wrap.style.cursor = onHead ? "grab" : "";
      pulls = pulls.filter((t) => now - t < 14000);
      if (L < 0.03 && held < 380) {
        if (z === "hair") { if (HAIRS.every(have)) hairI = hairI + 1 >= HAIRS.length ? -1 : hairI + 1; }
        else { const r = ZONES.tap[z]; if (r.startsWith("act:")) { if (actReady(r.slice(4))) startAct(r.slice(4), now); } else { moodFace = r; moodUntil = now + 1100; } poke(downU, downV, 0, 0.5, 0.06); }
        return;
      }
      pulls.push(now);
      const n = pulls.length;
      moodFace = n >= 8 ? "cry" : n >= 5 ? "angry" : L > 0.22 ? "dizzy" : L > 0.1 ? "scrunch" : "deadpan";
      moodUntil = now + (n >= 5 ? 2600 : 700 + L * 2800);
    };
    const onScroll = () => { const n = performance.now(); if (Math.abs(scrollY - lastScroll) > 2) { scrollUntil = n + 500; lastScroll = scrollY; } };
    addEventListener("pointermove", onMove); wrap.addEventListener("pointerdown", onDown);
    addEventListener("pointerup", release); addEventListener("pointercancel", release);
    addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }); io.observe(canvas);
    const ro = new ResizeObserver(() => { const r = Math.min(devicePixelRatio || 1, 2), b = canvas.getBoundingClientRect(); canvas.width = b.width * r; canvas.height = b.height * r; gl.viewport(0, 0, canvas.width, canvas.height); }); ro.observe(canvas);

    let raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (!ready || !visible || dead) return;
      const f = (r: number) => 1 - Math.exp(-dt * r);
      speed *= Math.exp(-dt * 6); shake += ((speed > 1.5 ? 1 : 0) - shake) * f(speed > 1.5 ? 1.2 : 0.9);

      if (act) { if (now - actT > act[actI][2]) advance(now); }
      else if (!reduced && !pressed && tStart && now - Math.max(lastInput, tStart) > nextIdle) {
        if (!rotation.length) rotation = ROTATION.filter(actReady);
        const nm = rotation.shift();
        if (nm) startAct(nm, now);
        lastInput = now; nextIdle = 30000 + Math.random() * 15000;
        if (!awake) wake(now);
      }

      const mk = Math.min(1, (now - moveT) / moveMs), me = mk * mk * (3 - 2 * mk);
      const wob = 1 - (mk >= 1 ? 0.85 : 0);
      flyPos = [flyFrom[0] + (flyTo[0] - flyFrom[0]) * me + Math.sin(now * 0.02) * 0.012 * wob, flyFrom[1] + (flyTo[1] - flyFrom[1]) * me + Math.cos(now * 0.027) * 0.012 * wob];
      place(fly!, flyPos[0], flyPos[1]);
      const hp = [handFrom[0] + (handTo[0] - handFrom[0]) * me, handFrom[1] + (handTo[1] - handFrom[1]) * me];
      place(hand!, hp[0], hp[1]);
      if (handGrip === "on" && !handHeld) { takeHold(hp[0], hp[1], 0.22); handHeld = true; hand!.classList.add("shut"); handGrip = "pull"; }
      if (handHeld && brush) { brush.px = hp[0] - brush.u; brush.py = hp[1] - brush.v; }
      if (handGrip === "off" && handHeld) { handHeld = false; brush = null; hand!.classList.remove("shut"); handGrip = false; }

      let want: string | null = "rest";
      const pull = brush ? Math.hypot(brush.px, brush.py) : 0;
      if (act) want = null;
      else if (pressed) want = pull > 0.24 ? "scared" : pull > 0.1 ? "ouch" : pull > 0.02 || zoneAt(downU, downV) !== "hair" ? "shock" : "rest";
      else if (moodFace && now < moodUntil) want = moodFace;
      else if (shake > 0.55) want = shake > 0.92 ? "sick" : "wind";
      else if (zone && now - zoneSince > 80 && ZONES.hover[zone]) want = ZONES.hover[zone];
      if (want) setFace(want, want === "rest" ? 110 : 90);

      if (logical === "rest" || !tex[logical]) {
        if (wantEyes) setEye(wantEyes, 60);
        else if (!awake) setEye("closed", 200);
        else if (blinkStep >= 0) {
          const s = (now - blinkT) / 62 | 0;
          if (s !== blinkStep) { blinkStep = s; if (s === 0) setEye("half", 20); else if (s === 1) setEye("closed", 20); else if (s === 2) setEye("half", 20); else blinkStep = -1; }
        } else {
          let target: number[];
          if (lookAt) { const p = lookAt(); target = [p[0] - 0.5, p[1] - 0.46]; }
          else if (now < scrollUntil) target = [0, 1];
          else target = [pu - 0.5, pv - 0.46];
          setEye(Math.hypot(target[0], target[1]) < 0.13 ? "rest" : ringFor(target[0], target[1]), 50);
          if (now > nextBlink) { blinkStep = 0; blinkT = now; setEye("half", 20); nextBlink = now + 2200 + Math.random() * 3400; }
        }
      }
      compose(now);

      const tx = (pressed || handHeld ? (brush ? brush.px * 0.16 : 0) : awake ? (pu - 0.5) * 0.012 : 0) + wantLean[0] + Math.sin(now * 0.0009) * 0.0015;
      const ty = (pressed || handHeld ? (brush ? brush.py * 0.16 : 0) : awake ? (pv - 0.46) * 0.008 : 0) + wantLean[1] + Math.sin(now * 0.0013) * 0.0022;
      lvX += ((tx - leanX) * 70 - lvX * 8) * dt; lvY += ((ty - leanY) * 70 - lvY * 8) * dt;
      leanX += lvX * dt; leanY += lvY * dt;

      simLeft += dt;
      let steps = 0;
      while (simLeft >= H && steps < 9) { step(H); simLeft -= H; steps++; }
      if (steps === 9) simLeft = 0;
      for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
        const k = j * M + i, edge = i === 0 || j === 0 || i === N || j === N;
        sx[k] = edge ? ux[k] : (ux[k] * 4 + ux[k - 1] + ux[k + 1] + ux[k - M] + ux[k + M]) / 8;
        sy[k] = edge ? uy[k] : (uy[k] * 4 + uy[k - 1] + uy[k + 1] + uy[k - M] + uy[k + M]) / 8;
      }
      untangle();
      for (let k = 0, o = 0; k < count; k++) {
        dyn[o++] = sx[k]; dyn[o++] = sy[k];
        const r = k % M, c = k / M | 0;
        let shd = 1;
        if (r > 0 && r < N && c > 0 && c < N) shd = Math.max(0.86, Math.min(1.16, 1 - ((sx[k + 1] - sx[k - 1]) + (sy[k + M] - sy[k - M])) * 1.8));
        dyn[o++] = shd;
      }
      gl!.bindBuffer(gl!.ARRAY_BUFFER, dynBuf); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, dyn);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, tex[faceA] || tex.rest);
      gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, tex[faceB] || tex.rest);
      gl!.uniform1f(U.fade, Math.min(1, (now - fadeT) / fadeMs));
      gl!.uniform2f(U.lean, leanX, leanY);
      gl!.drawElements(gl!.TRIANGLES, idx.length, gl!.UNSIGNED_SHORT, 0);
    }

    (async () => {
      const base = await load("rest");
      if (!base || dead) return;
      upload("rest", base); hitMap(base);
      fb.style.visibility = "hidden";
      ready = true; tStart = performance.now(); raf = requestAnimationFrame(frame);
      const take = async (n: string) => { const img = await load(n); if (img && !dead) upload(n, img); };
      await take("closed"); await take("half");
      const names = Object.keys(faces).filter((n) => !["rest", "closed", "half"].includes(n));
      let i = 0;
      await Promise.all(Array.from({ length: 6 }, async () => { while (i < names.length) await take(names[i++]); }));
    })();

    return () => {
      dead = true; cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove); wrap.removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", release); removeEventListener("pointercancel", release);
      removeEventListener("scroll", onScroll); io.disconnect(); ro.disconnect();
      canvas.remove(); // never loseContext: StrictMode remounts reuse nothing, but a lost context would kill the next run
      fb.style.visibility = "visible";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces.rest, mask]);

  return (
    <div ref={box} className={`lp-wrap relative select-none ${className}`} style={{ touchAction: "pan-y" }}>
      <style>{`
        .lp-fly,.lp-hand{position:absolute;opacity:0;transition:opacity .2s;transform:translate(-50%,-50%)}
        .lp-fly{width:6%;fill:#111}
        .lp-fly .wing{fill:rgba(220,235,255,.7);transform-origin:16px 15px;animation:lp-flap .05s linear infinite alternate}
        .lp-fly .wing.r{animation-direction:alternate-reverse}
        @keyframes lp-flap{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}
        .lp-hand{width:11%;fill:#fff;stroke:#0c0c0c;stroke-width:1.4;stroke-linejoin:round}
        .lp-hand .grab{display:none}.lp-hand.shut .open{display:none}.lp-hand.shut .grab{display:block}
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={fallback} src={faces.rest} alt={alt} draggable={false} className="block h-auto w-full select-none object-contain" style={{ WebkitUserDrag: "none" } as React.CSSProperties} />
      <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0">
        <svg ref={flyEl} className="lp-fly" viewBox="0 0 32 32"><path className="wing" d="M15 15C12 9.500 4.500 8.500 2 13c2.500 4.500 10 4.500 13 2z" /><path className="wing r" d="M17 15c3-5.500 10.500-6.500 13-2-2.500 4.500-10 4.500-13 2z" /><ellipse cx="16" cy="19.500" rx="4" ry="6.500" /><circle cx="16" cy="11.500" r="3.300" /></svg>
        <svg ref={handEl} className="lp-hand" viewBox="0 0 32 32"><path className="open" d="M10.500 16.500V8.200a1.800 1.800 0 0 1 3.600 0V14v-8a1.800 1.800 0 0 1 3.600 0V14 7a1.800 1.800 0 0 1 3.600 0v8-5a1.800 1.800 0 0 1 3.600 0v10.500c0 5-3.400 8.500-8.400 8.500-3.600 0-5.700-1.600-7.600-4.600l-3.500-5.600c-.6-1 .1-2.200 1.200-2.400 1-.2 1.900.2 2.600 1z" /><path className="grab" d="M10.500 17v-3.300a1.800 1.800 0 0 1 3.600 0V14v-1.800a1.800 1.800 0 0 1 3.600 0V14v-1.300a1.800 1.800 0 0 1 3.600 0V14v-.3a1.800 1.800 0 0 1 3.600 0v6.800c0 5-3.400 8.500-8.400 8.500-3.600 0-5.700-1.600-7.600-4.600l-2.300-3.700c-.6-1 .1-2.200 1.200-2.400 1-.2 1.900.2 2.700 1z" /></svg>
      </div>
    </div>
  );
}
