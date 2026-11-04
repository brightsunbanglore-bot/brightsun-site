"use client";

import { isSilentPage, stopSnore, heroVoiceReady, mouthLevel, sceneClipTime, sunnyFun, wakeSunnySound, whenSoundReady } from "./sunnyAudio";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND } from "./palette";
import { mascotState } from "./mascotState";
import { GROUND, makePose, type Arm, type Expression, type Leg, type Rig } from "./sunnyPose";
import {
  celebrate,
  dizzy,
  entrance,
  entranceSynced,
  menuShow,
  prideShow,
  finaleShow,
  journeyShow,
  sleepOnCloud,
  shushIn,
  shushHold,
  MUTED_ACTS,
  wakeUp,
  EXTREME_IDLE,
  SERVICE_ACTS,
  WORK_ACTS,
  examine,
  giggle,
  goodbye,
  jumpAndDance,
  nod,
  pointTo,
  sitAndSwing,
  surpriseHop,
  wave,
  withRecover,
  type Act,
} from "./sunnyActs";
import { Comb, GloveHand, Sneaker, SunnyEye, Sunglasses, Toothbrush, type SunnyMaterials } from "./sunnyParts";

const Z = new THREE.Vector3(0, 0, 1);
const damp = THREE.MathUtils.damp;
const HEAD = new THREE.Vector3();

/**
 * Place a feature on the face sphere (radius 1). `aim` blends its facing
 * direction from the surface normal (0) towards straight ahead (1) — used
 * so the eyes look forward together instead of splaying outward.
 */
function onFace(x: number, y: number, lift = 0, aim = 0) {
  const n = new THREE.Vector3(x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))).normalize();
  const facing = n.clone().lerp(Z, aim).normalize();
  return {
    position: n.clone().multiplyScalar(1 + lift).toArray() as [number, number, number],
    quaternion: new THREE.Quaternion().setFromUnitVectors(Z, facing).toArray() as [number, number, number, number],
  };
}

/**
 * Flame flare: a flat, wavy flame blade with a curled tip (base at y = 0,
 * inside the face). Bevelled for a glossy 3D look; optional vertex-colour
 * gradient from warm orange at the root to deep orange at the tip.
 */
function flameShape(w: number) {
  const s = new THREE.Shape();
  s.moveTo(-0.3 * w, 0);
  s.bezierCurveTo(-0.36 * w, 0.22, -0.1 * w, 0.34, -0.16 * w, 0.52);
  s.bezierCurveTo(-0.22 * w, 0.7, -0.02 * w, 0.86, 0.2 * w, 1.0);
  s.bezierCurveTo(0.12 * w, 0.86, 0.12 * w, 0.74, 0.2 * w, 0.62);
  s.bezierCurveTo(0.3 * w, 0.48, 0.38 * w, 0.3, 0.3 * w, 0);
  s.closePath();
  return s;
}

const FLARE_ROOT = new THREE.Color("#FFA51F");
const FLARE_TIP = new THREE.Color("#FF7612");

function flareGeometry(len: number, width: number, depth: number, gradient: boolean) {
  const g = new THREE.ExtrudeGeometry(flameShape(width), {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.9,
    bevelSize: 0.035,
    bevelSegments: 5,
    curveSegments: 24,
  });
  g.translate(0, 0, -depth / 2);
  g.scale(len, len, 1);
  if (gradient) {
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.max(0, pos.getY(i) / len));
      c.copy(FLARE_ROOT).lerp(FLARE_TIP, Math.pow(t, 1.2));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  g.computeVertexNormals();
  return g;
}

/** Alternating long and short flame flares, each with a pale-yellow glow rim. */
function rayGeometries() {
  return {
    long: flareGeometry(1.0, 1, 0.07, true),
    longRim: flareGeometry(1.0, 1.3, 0.05, false),
    short: flareGeometry(0.68, 1.05, 0.07, true),
    shortRim: flareGeometry(0.68, 1.38, 0.05, false),
  };
}

function useRayMaterials() {
  const m = useMemo(
    () => ({
      core: new THREE.MeshPhysicalMaterial({
        color: "#FFFFFF",
        vertexColors: true,
        roughness: 0.32,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        emissive: new THREE.Color(BRAND.flame),
        emissiveIntensity: 0.06,
      }),
      rim: new THREE.MeshPhysicalMaterial({
        color: "#FFEE9A",
        roughness: 0.45,
        clearcoat: 0.3,
        emissive: new THREE.Color("#FFE680"),
        emissiveIntensity: 0.18,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      m.core.dispose();
      m.rim.dispose();
    },
    [m],
  );
  return m;
}

function useMaterials(): SunnyMaterials {
  const m = useMemo(() => {
    const soft = (color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.5,
        sheen: 0.3,
        sheenColor: new THREE.Color(BRAND.ivory),
        sheenRoughness: 0.7,
        clearcoat: 0.15,
        clearcoatRoughness: 0.5,
        ...extra,
      });
    const gloss = (color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, ...extra });
    return {
      // glossy sunshine-yellow face
      body: soft("#FFCB12", { roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.28, sheen: 0.15 }),
      // slim rubber-hose limbs
      limb: soft("#FFB627", { roughness: 0.5 }),
      glove: soft("#FFFFFF", { roughness: 0.62, sheen: 0.5, sheenColor: new THREE.Color(BRAND.cream), clearcoat: 0.05 }),
      rayA: soft(BRAND.flame),
      rayB: soft("#FFA21A"),
      sclera: gloss("#FFFEFA", { roughness: 0.12 }),
      iris: gloss("#4A2812"),
      pupil: gloss("#140D0A"),
      shine: new THREE.MeshBasicMaterial({ color: "#FFFFFF" }),
      ink: new THREE.MeshStandardMaterial({ color: BRAND.espresso, roughness: 0.45 }),
      cheek: soft("#FF8A3D", { roughness: 0.6, sheen: 0, clearcoat: 0 }),
      tongue: new THREE.MeshStandardMaterial({ color: "#FF7A2E", roughness: 0.55 }),
      teeth: soft("#FFFFFF", { roughness: 0.3, sheen: 0 }),
      // sneakers
      shoeUpper: soft(BRAND.flame, { roughness: 0.62, sheen: 0.4 }),
      shoeAccent: soft(BRAND.ivory, { roughness: 0.55 }),
      midsole: soft("#FFFFFF", { roughness: 0.45, sheen: 0 }),
      outsole: soft(BRAND.espresso, { roughness: 0.8, sheen: 0, clearcoat: 0 }),
      // sunglasses: tinted lenses (eyes faintly visible), dark frames, teal arms + glints
      lens: new THREE.MeshPhysicalMaterial({
        color: "#1E1418",
        roughness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        transparent: true,
        opacity: 0.86,
      }),
      frame: gloss("#2A1218", { roughness: 0.18 }),
      glint: new THREE.MeshStandardMaterial({
        color: "#3E8C96",
        roughness: 0.25,
        emissive: new THREE.Color("#2F7C88"),
        emissiveIntensity: 0.35,
      }),
      temple: gloss("#2F7E86", { roughness: 0.2 }),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(m).forEach((mat) => mat.dispose());
    },
    [m],
  );
  return m;
}

const RAY_COUNT = 12;

/** Upper-eyelid angle per expression (rotation.x of the lid shell). */
const LID: Record<Expression, number> = { normal: -1.0, happy: 0.45, surprised: -1.3, dizzy: 0.15, effort: -0.75, sleep: 1.57 }; // effort: eyes open, brows knit

type Props = { reducedMotion: boolean; compact: boolean; onReady?: () => void; /** Scripted mode: a scene drives the pose; no idle tricks, no cursor look. */ rig?: Rig };

/**
 * Sunny — BrightSunSEO's mascot, built in code so every joint can move.
 *
 * Look: glossy realistic eyes with eyelids, slim rubber-hose arms and legs,
 * four-finger glove hands and proper sneakers; sunglasses as a prop.
 *
 * Rig:  root(x, y, turn) → squash (pivot at feet) → roll (pivot at centre)
 *       → body + face + rays, shoulders → elbows → wrists → gloves,
 *       hips → knees → ankles → sneakers.
 *
 * Behaviour: rolls in as a ball and pops up; then idles (breathing, ray
 * wiggle, blinking, eyes following the cursor) and every few seconds does
 * something funny — sits and swings its legs, jumps and dances (with
 * sunglasses), or waves. Poke it to giggle; three quick pokes = dizzy.
 */
export function SunnyCharacter({ reducedMotion, compact, onReady, rig }: Props) {
  const rigRef = useRef(rig);
  rigRef.current = rig;
  const mat = useMaterials();
  const rays = useMemo(() => rayGeometries(), []);
  useEffect(() => () => Object.values(rays).forEach((g) => g.dispose()), [rays]);
  const rayMat = useRayMaterials();

  const face = useMemo(
    () => ({
      eyeL: onFace(-0.31, 0.04, -0.12, 0.6),
      eyeR: onFace(0.31, 0.04, -0.12, 0.6),
      browL: onFace(-0.31, 0.36, 0.01),
      browR: onFace(0.31, 0.36, 0.01),
      cheekL: onFace(-0.58, -0.2, 0.0),
      cheekR: onFace(0.58, -0.2, 0.0),
      nose: onFace(0, -0.16, 0.02),
      mouth: onFace(0, -0.34, 0.02),
    }),
    [],
  );

  // Rig refs
  const root = useRef<THREE.Group>(null);
  const squash = useRef<THREE.Group>(null);
  const roll = useRef<THREE.Group>(null);
  const rayRefs = useRef<(THREE.Group | null)[]>([]);
  const cloudG = useRef<THREE.Group>(null);
  const headTick = useRef(0);
  const wristR = useRef<THREE.Group>(null);
  const upperR = useRef<THREE.Mesh>(null);
  const zRefs = useRef<(THREE.Group | null)[]>([]);
  const shoulderL = useRef<THREE.Group>(null);
  const shoulderR = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);
  const fingersL = useRef<(THREE.Group | null)[]>([]);
  const fingersR = useRef<(THREE.Group | null)[]>([]);
  const hipL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  // Face refs
  const gazeL = useRef<THREE.Group>(null);
  const gazeR = useRef<THREE.Group>(null);
  const lidL = useRef<THREE.Group>(null);
  const lidR = useRef<THREE.Group>(null);
  const eyeScale = useRef<(THREE.Group | null)[]>([]);
  const brows = useRef<(THREE.Group | null)[]>([]);
  const mouthOpen = useRef<THREE.Group>(null);
  const mouthSmile = useRef<THREE.Group>(null);
  const mouthO = useRef<THREE.Group>(null);
  const zipper = useRef<THREE.Group>(null);
  const ropeG = useRef<THREE.Group>(null);
  const shades = useRef<THREE.Group>(null);
  const brushProp = useRef<THREE.Group>(null);
  const combProp = useRef<THREE.Group>(null);
  const foamRefs = useRef<(THREE.Group | null)[]>([]);
  const hairRefs = useRef<(THREE.Group | null)[]>([]);

  // Behaviour state
  const pose = useRef(makePose());
  const expr = useRef<Expression>("normal");
  const act = useRef<gsap.core.Timeline | null>(null);
  const look = useRef({ x: 0, y: 0 });
  const walkPhase = useRef(0);
  const prevX = useRef(0);
  const lid = useRef(LID.normal);
  const mouthLv = useRef(0);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // ---- Behaviour director -------------------------------------------------
  useEffect(() => {
    const p = pose.current;
    const setExpr = (e: Expression) => {
      expr.current = e;
    };
    // Scripted mode (logo intro): hand the pose to the scene and stay out of the way.
    if (rigRef.current) {
      const cleanup = rigRef.current({ pose: p, setExpr });
      return () => {
        cleanup?.();
        Object.assign(p, makePose());
        expr.current = "normal";
      };
    }
    if (reducedMotion) return;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let lastPokes = mascotState.pokes;
    let pokeTimes: number[] = [];
    let lastScrollWave = false;

    // Acts flagged "locked" (entrance, surprise) are never cut short: a cue
    // that arrives meanwhile waits and plays as soon as they finish.
    let pendingCue = "";
    const play = (tl: gsap.core.Timeline) => {
      act.current?.kill();
      clearTimeout(idleTimer);
      act.current = tl;
      tl.eventCallback("onComplete", () => {
        act.current = null;
        if (pendingCue) {
          const next = pendingCue;
          pendingCue = "";
          playCue(next);
          return;
        }
        // muted: always settle back into the finger-on-lips pose before idling again
        if (mascotState.muted && tl.data !== "shush") {
          play(shushHold(p, setExpr));
          return;
        }
        scheduleIdleAct();
      });
    };
    const locked = () => act.current?.data === "locked";

    // Named acts: review links (?sunny=…) and scroll-scene cues.
    const byName: Partial<Record<string, Act>> = {
      sit: sitAndSwing,
      dance: jumpAndDance,
      wave,
      hello: wave,
      peek: jumpAndDance, // the off-stage peek-a-boo is retired (stage edge cut him in half)
      nod,
      point: pointTo(1),
      "point-left": pointTo(-1),
      celebrate,
      goodbye,
      ...SERVICE_ACTS,
      ...WORK_ACTS,
      examine,
      // services: bouncy menu presentation when the recorded voice is playing, a simple nod otherwise
      menu: (pose, setExpr) => {
        const at = sceneClipTime("services");
        if (at < 0) return nod(pose, setExpr);
        const m = menuShow(pose, setExpr);
        m.time(Math.min(at + 0.1, m.duration() - 0.1), true); // join in step with the voice, even if a little late
        return m;
      },
      // work: proud, bragging performance timed to the work voice, a nod otherwise
      pride: (pose, setExpr) => {
        const at = sceneClipTime("work");
        if (at < 0) return nod(pose, setExpr);
        const m = prideShow(pose, setExpr);
        m.time(Math.min(at + 0.1, m.duration() - 0.1), true);
        return m;
      },
      // journey: acts out the search, the three steps and the climbing ranking, timed to the journey voice
      journey: (pose, setExpr) => {
        const at = sceneClipTime("journey");
        if (at < 0) return examine(pose, setExpr);
        const m = journeyShow(pose, setExpr);
        m.time(Math.min(at + 0.1, m.duration() - 0.1), false);
        return m;
      },
      // finale: points at the form, air-types, salutes and waves goodbye, timed to the finale voice
      finale: (pose, setExpr) => {
        const at = sceneClipTime("finale");
        if (at < 0) return goodbye(pose, setExpr);
        const m = finaleShow(pose, setExpr);
        m.time(Math.min(at + 0.1, m.duration() - 0.1), true);
        return m;
      },
      "surprise-work": surpriseHop("work"),
    };
    // Gentle substitutes when the visitor has asked for a calmer Sunny.
    const calmName: Partial<Record<string, string>> = {
      peek: "nod",
      dance: "nod",
      celebrate: "nod",
      "surprise-work": "",
    };
    // ---- 30 s of no activity: Sunny lies down on a cloud and sleeps; any activity wakes him ----
    let lastActive = performance.now();
    const sleeping = () => act.current?.data === "sleep";
    const wake = () => {
      if (!sleeping()) return;
      const w = wakeUp(p, setExpr);
      w.data = "locked";
      play(w);
    };
    const activity = () => {
      lastActive = performance.now();
      if (sleeping()) wake();
    };
    const evs = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, activity, { passive: true }));
    // scrolling back up: Sunny reacts with something extreme and silly
    let lastY = window.scrollY;
    let upDist = 0;
    let funCool = 0;
    let maxY = lastY;
    const onScrollUp = () => {
      const y = window.scrollY;
      maxY = Math.max(maxY, y);
      upDist = y < lastY ? upDist + (lastY - y) : 0;
      lastY = y;
      const now = performance.now();
      const nearTop = y < 120 && maxY > 500;
      if ((upDist > 450 || nearTop) && now > funCool && !locked() && !sleeping() && !mascotState.calm && !mascotState.muted && !sceneBusy()) {
        funCool = now + 5000;
        upDist = 0;
        if (nearTop) maxY = 0;
        play(withRecover(EXTREME_IDLE[Math.floor(Math.random() * EXTREME_IDLE.length)], p, setExpr));
      }
    };
    const sceneBusy = () => ["hero", "services", "journey", "work", "finale"].some((n) => sceneClipTime(n) >= 0);
    window.addEventListener("scroll", onScrollUp, { passive: true });
    let showTl: gsap.core.Timeline | null = null;
    const playCue = (name: string) => {
      if (name === "examine" && showTl && act.current === showTl) return; // the voiced show already covers it
      if (sleeping()) { pendingCue = name; wake(); return; }
      const resolved = mascotState.calm && name in calmName ? calmName[name] : name;
      const fn = resolved ? byName[resolved] : undefined;
      if (!fn) return;
      // the services voice is playing right now: the menu show takes over from any other act
      const voiceNow = (resolved === "menu" && sceneClipTime("services") >= 0) || (resolved === "pride" && sceneClipTime("work") >= 0) || (resolved === "finale" && sceneClipTime("finale") >= 0) || (resolved === "journey" && sceneClipTime("journey") >= 0);
      if (locked() && !voiceNow) {
        pendingCue = name;
        return;
      }
      // the menu show starts at once (no recover pause) so its gestures line up with the voice
      const direct = resolved === "menu" || resolved === "pride" || resolved === "finale" || resolved === "journey";
      const tl = direct ? fn(p, setExpr) : withRecover(fn, p, setExpr);
      if (resolved?.startsWith("surprise") || direct) tl.data = "locked";
      if (direct) showTl = tl;
      play(tl);
    };

    const heroIdle: Act[] = [EXTREME_IDLE[0], sitAndSwing, EXTREME_IDLE[3], jumpAndDance, EXTREME_IDLE[1], wave, EXTREME_IDLE[2], EXTREME_IDLE[4], EXTREME_IDLE[5]];
    const miniIdle: Act[] = [wave, EXTREME_IDLE[3], nod, EXTREME_IDLE[0], EXTREME_IDLE[4], jumpAndDance, EXTREME_IDLE[2], EXTREME_IDLE[5], EXTREME_IDLE[1]];
    let order = 0;
    const scheduleIdleAct = () => {
      clearTimeout(idleTimer);
      if (mascotState.muted) {
        idleTimer = setTimeout(() => {
          if (act.current) return;
          const tl = MUTED_ACTS[Math.floor(Math.random() * MUTED_ACTS.length)](p, setExpr);
          tl.data = "shush";
          play(tl);
        }, 3000 + Math.random() * 3500);
        return;
      }
      const requested = byName[mascotState.firstAct];
      const mini = mascotState.mode === "mini";
      // Calm: no unprompted tricks (requested review acts still play).
      if (mascotState.calm && !requested) return;
      idleTimer = setTimeout(
        () => {
          if (act.current) return;
          if (requested) {
            mascotState.firstAct = "";
            play(withRecover(requested, p, setExpr));
            return;
          }
          const list = mascotState.mode === "mini" ? miniIdle : heroIdle;
          const next = list[order % list.length];
          order += 1;
          play(withRecover(next, p, setExpr));
        },
        requested ? 600 : mini ? 9000 + Math.random() * 6000 : 4500 + Math.random() * 3000,
      );
    };

    // Entrance: roll in, stand up, then dash straight off for the peek-a-boo + moonwalk.
    let intro = entrance(p, setExpr, compact ? 3.6 : 4.8);
    intro.data = "locked";
    // Hold the roll-in briefly so the first click can unlock sound (woo-hoo + hello land with it).
    let started = false;
    const startIntro = () => {
      if (started) return;
      started = true;
      // With the recorded voice, use the roll-in choreographed to it (the voice starts with the roll).
      if (heroVoiceReady()) {
        intro.kill();
        intro = entranceSynced(p, setExpr, compact ? 3.6 : 4.8);
        intro.data = "locked";
      }
      play(intro);
    };
    // silent pages don't wait for the click that unlocks sound
    if (isSilentPage()) startIntro();
    else void whenSoundReady(120000).then(startIntro);

    // Pokes, scene cues and scroll reactions are polled (no React state involved).
    let lastCue = mascotState.cueId;
    let lastMuted = mascotState.muted;
    const poll = setInterval(() => {
      if (mascotState.muted !== lastMuted) {
        lastMuted = mascotState.muted;
        if (started) {
          pendingCue = "";
          const t = lastMuted ? shushIn(p, setExpr) : withRecover(wave, p, setExpr);
          play(t);
        }
      }
      if (mascotState.cueId !== lastCue) {
        lastCue = mascotState.cueId;
        playCue(mascotState.cue);
      }
      if (mascotState.pokes !== lastPokes) {
        // Several pokes can land between two polls — count each one.
        wakeSunnySound(); // clicking Sunny himself means the visitor wants his sounds
        const fresh = Math.max(1, mascotState.pokes - lastPokes);
        lastPokes = mascotState.pokes;
        const now = performance.now();
        pokeTimes = [...pokeTimes.filter((t) => now - t < 1600), ...Array.from({ length: fresh }, () => now)];
        if (sleeping()) {
          wake();
        } else if (locked()) {
          // ignore pokes during the entrance / surprise
        } else if (pokeTimes.length >= 3) {
          pokeTimes = [];
          sunnyFun("dizzy");
          play(withRecover(dizzy, p, setExpr));
        } else if (!act.current || act.current.data !== "poke") {
          sunnyFun(pokeTimes.length % 2 ? "squeak" : "giggle");
          const tl = withRecover(giggle, p, setExpr);
          tl.data = "poke";
          play(tl);
        }
      }
      const scrolled = mascotState.scroll > 0.18;
      if (scrolled && !lastScrollWave && !act.current) play(withRecover(wave, p, setExpr));
      // back at the header: something extreme and silly
      if (!scrolled && lastScrollWave && !locked() && !sleeping() && !mascotState.calm && !mascotState.muted) {
        play(withRecover(EXTREME_IDLE[Math.floor(Math.random() * EXTREME_IDLE.length)], p, setExpr));
      }
      lastScrollWave = scrolled;
      // voice playing = not idle
      if (["hero", "services", "journey", "work", "finale"].some((n) => sceneClipTime(n) >= 0)) lastActive = performance.now();
      if (performance.now() - lastActive > 30000 && !act.current) play(sleepOnCloud(p, setExpr));
    }, 80);

    return () => {
      started = true; // never start the roll-in after unmount
      clearInterval(poll);
      evs.forEach((e) => window.removeEventListener(e, activity));
      window.removeEventListener("scroll", onScrollUp);
      stopSnore();
      clearTimeout(idleTimer);
      act.current?.kill();
      act.current = null;
      Object.assign(p, makePose());
      expr.current = "normal";
    };
  }, [reducedMotion, compact]);

  // ---- Render loop: apply pose + procedural life --------------------------
  useFrame((state, delta) => {
    const p = pose.current;
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const d = Math.min(delta, 1 / 30);
    const manual = !!rigRef.current;
    const idle = !act.current && !reducedMotion && !manual;

    // Eyes and body follow the cursor.
    look.current.x = damp(look.current.x, reducedMotion || manual ? 0 : mascotState.pointerX, 6, d);
    look.current.y = damp(look.current.y, reducedMotion || manual ? 0 : mascotState.pointerY, 6, d);
    const lx = look.current.x;
    const ly = look.current.y;

    const breath = 1 + Math.sin(t * 2.6) * 0.028;

    // ---- Gaits: walk / run / moonwalk -------------------------------------
    // The stride phase advances with the distance actually travelled, so the
    // feet never skate whatever the speed. Stride length per full two-step
    // cycle: walk 1.1, run 1.8, moonwalk 0.8 (blended by weight).
    const gw = p.walk;
    const gr = p.run;
    const gm = p.moon;
    const gTot = gw + gr + gm;
    const stride = gTot > 0.001 ? (gw * 1.1 + gr * 1.8 + gm * 0.8) / gTot : 1.1;
    walkPhase.current += Math.abs(p.x - prevX.current) * ((Math.PI * 2) / stride);
    prevX.current = p.x;
    const ph = walkPhase.current;
    // Walk: highest at mid-stance. Run: lowest at mid-stance (compression),
    // airborne between foot contacts. Moonwalk: a soft, even glide.
    const walkBob =
      gw * 0.065 * (0.5 + 0.5 * Math.cos(2 * ph)) +
      gr * 0.15 * (0.5 - 0.5 * Math.cos(2 * ph)) +
      gm * 0.025 * (0.5 + 0.5 * Math.cos(2 * ph));
    // Forward lean (run leans in; moonwalk leans back slightly).
    const lean = gw * 0.05 + gr * 0.24 - gm * 0.05;
    // Torso counter-twist against the legs.
    const twist = Math.sin(ph) * (gw * 0.07 + gr * 0.12);

    if (root.current) {
      // Scripted mode: Sunny stays centred in his own canvas (the scene moves the canvas instead),
      // so a wide stage never stretches him with wide-angle perspective. p.x still drives the stride.
      root.current.position.set(manual ? 0 : p.x, p.y + (idle ? Math.abs(Math.sin(t * 1.3)) * 0.06 : 0) + walkBob, 0);
      // (cursor turn is muted while peeking so the hands stay on the stage edge)
      root.current.rotation.y = p.turn + twist + lx * 0.09 * (1 - p.peek) - (reducedMotion ? 0 : mascotState.scroll * 0.2);
      root.current.rotation.x = -ly * 0.08 + (reducedMotion ? 0 : mascotState.scroll * 0.16);
    }
    if (root.current && !manual) {
      headTick.current += 1;
      if (headTick.current % 2 === 0) {
        HEAD.set(0, 1.25, 0);
        root.current.localToWorld(HEAD);
        HEAD.project(state.camera);
        const rc = state.gl.domElement.getBoundingClientRect();
        mascotState.headX = rc.left + (HEAD.x * 0.5 + 0.5) * rc.width;
        mascotState.headY = rc.top + (-HEAD.y * 0.5 + 0.5) * rc.height;
        HEAD.set(0, 1.9, 0);
        root.current.localToWorld(HEAD);
        HEAD.project(state.camera);
        mascotState.topX = rc.left + (HEAD.x * 0.5 + 0.5) * rc.width;
        mascotState.topY = rc.top + (-HEAD.y * 0.5 + 0.5) * rc.height;
      }
    }
    if (cloudG.current) {
      const c = reducedMotion ? 0 : p.cloud;
      cloudG.current.visible = c > 0.01;
      cloudG.current.scale.setScalar(Math.max(c * 0.58, 0.001)); // small enough to stay inside Sunny's stage (no clipped edges)
      cloudG.current.position.set(0.15, -1.22 + Math.sin(t * 1.2) * 0.03, 0);
      zRefs.current.forEach((z, i) => {
        if (!z) return;
        const ph = (t * 0.45 + i / 3) % 1;
        const a = p.zzz * Math.sin(ph * Math.PI);
        z.visible = a > 0.02;
        z.position.set(-0.9 - ph * 0.35, 0.8 + ph * 1.0, 0.6);
        z.scale.setScalar(Math.max(0.001, a * (0.5 + ph * 0.5)));
      });
    }
    if (squash.current) {
      const sy = p.squash * breath;
      const sx = 1 / Math.sqrt(sy);
      squash.current.scale.set(sx, sy, sx);
    }
    if (roll.current) {
      roll.current.rotation.z = p.roll + p.tilt + (idle ? Math.sin(t * 0.9) * 0.025 : 0) + (gw + gr) * Math.sin(ph) * 0.045;
      roll.current.rotation.x = lean;
    }


    // Flares flicker like flames: long ones sway more than short ones.
    rayRefs.current.forEach((r, i) => {
      if (!r) return;
      const long = i % 2 === 0;
      const w = Math.sin(t * 3 + i * 0.9);
      r.scale.set(1, 1 + w * (long ? 0.07 : 0.05), 1);
      r.rotation.x = w * 0.05;
      r.rotation.z = Math.sin(t * 2.2 + i * 1.3) * (long ? 0.06 : 0.035);
    });

    // Arms, hands & legs (limbs scale to 0 when curled into a ball).
    const ls = Math.max(0.001, p.limbs);
    const sway = idle ? Math.sin(t * 1.8) * 0.06 : 0;
    const applyArm = (
      sh: THREE.Group | null,
      el: THREE.Group | null,
      fingers: (THREE.Group | null)[],
      a: Arm,
      side: 1 | -1,
      phase: number,
      swing: number,
      bendExtra: number,
    ) => {
      if (!sh || !el) return;
      sh.scale.setScalar(ls);
      sh.rotation.set(-a.fwd - swing, 0, side * (0.3 + a.raise + sway * phase));
      el.rotation.set(0, 0, -side * (a.bend + bendExtra)); // positive bend folds the forearm inward
      fingers.forEach((f, i) => f && (f.rotation.x = a.grip * (i === 3 ? 0.9 : 1.6)));
    };
    // Arms swing opposite to the legs: relaxed when walking, pumping with
    // bent elbows when running, loose and low for the moonwalk.
    const armSwing = Math.sin(ph) * (gw * 0.45 + gr * 1.0 + gm * 0.15);
    const armBend = gw * 0.25 + gr * 1.25 + gm * 0.45;
    applyArm(shoulderL.current, elbowL.current, fingersL.current, p.armL, -1, 1, armSwing, armBend);
    applyArm(shoulderR.current, elbowR.current, fingersR.current, p.armR, 1, -1, -armSwing, armBend);
    if (wristR.current) wristR.current.rotation.set(p.wristX, 0, p.wrist);
    if (shoulderR.current) {
      // "shhh": the shoulder slides forward onto the chest so the hand can reach the lips; the index finger stays straight
      const k = p.shush;
      // shoulder stays on the body's right edge; the upper arm stretches (rubber-hose) across his tummy
      shoulderR.current.position.set(0.88 - 0.06 * k, -0.3 - 0.15 * k, 0.12 + 0.26 * k);
      const st = 1 + 2.42 * k;
      if (upperR.current) {
        upperR.current.position.y = -0.13 * st;
        upperR.current.scale.set(1, Math.max(1, (0.26 * st + 0.04) / 0.276), 1); // one continuous piece from shoulder to elbow
      }
      if (elbowR.current) elbowR.current.position.y = -0.26 * st;
      const idx = fingersR.current[1];
      if (idx && p.point > 0) idx.rotation.x = p.armR.grip * 1.6 * (1 - p.point);
    }
    const applyLeg = (
      hip: THREE.Group | null,
      knee: THREE.Group | null,
      foot: THREE.Group | null,
      l: Leg,
      legPhase: number,
    ) => {
      if (!hip || !knee || !foot) return;
      hip.scale.setScalar(ls);
      const s = Math.sin(legPhase);
      const swingThrough = Math.max(0, Math.cos(legPhase)); // leg travelling forward
      const bent = Math.max(0, s); // moonwalk: this leg's heel is up
      // negative hip = leg forward; positive foot = toes down
      const strideHip = gw * -s * 0.5 + gr * -s * 0.95 + gm * (-bent * 0.32 + Math.max(0, -s) * 0.12);
      const strideKnee =
        gw * (swingThrough * 0.85 + 0.06) + gr * (swingThrough * 1.75 + 0.25) + gm * (bent * 0.72 + 0.04);
      // heel strike (toes up) as the leg lands in front, push off the toes behind
      const footRoll = gw * -s * 0.3 + gr * -s * 0.4 + gm * bent * 0.6;
      hip.rotation.x = l.hip + strideHip;
      knee.rotation.x = l.knee + strideKnee;
      foot.rotation.x = -(l.hip + strideHip + l.knee + strideKnee) * 0.6 + footRoll;
    };
    applyLeg(hipL.current, kneeL.current, footL.current, p.legL, ph);
    applyLeg(hipR.current, kneeR.current, footR.current, p.legR, ph + Math.PI);

    // Face: gaze, eyelids (blink / squint), brows, mouth.
    const e: Expression = idle && mascotState.hover && expr.current === "normal" ? "happy" : expr.current;
    const blinkPhase = (t + 0.7) % 3.9;
    const blinking = e === "normal" && blinkPhase < 0.16;
    lid.current = blinking ? 1.57 : damp(lid.current, LID[e], 14, d);
    [lidL.current, lidR.current].forEach((l) => l && (l.rotation.x = lid.current));

    const dizzySpin = e === "dizzy" ? t * 9 : 0;
    [gazeL.current, gazeR.current].forEach((g, i) => {
      if (!g) return;
      if (e === "dizzy") {
        const dir = i === 0 ? 1 : -1;
        g.rotation.set(Math.cos(dizzySpin * dir) * 0.35, Math.sin(dizzySpin * dir) * 0.35, 0);
      } else {
        g.rotation.set(-ly * 0.35, lx * 0.45, 0);
      }
    });
    eyeScale.current.forEach((g) => g && g.scale.setScalar(e === "surprised" ? 1.52 : 1.4));
    brows.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = e === "surprised" ? 0.07 : e === "happy" ? 0.035 : e === "effort" ? -0.035 : 0;
      // effort: brows knit inward and down
      g.rotation.z = damp(g.rotation.z, e === "effort" ? (i === 0 ? -0.4 : 0.4) : 0, 14, d);
    });
    // Lip sync: while the voice is playing, the mouth opens and closes with its loudness.
    const talk = manual || reducedMotion || e === "sleep" ? 0 : mouthLevel();
    mouthLv.current = damp(mouthLv.current, talk, talk > mouthLv.current ? 40 : 22, d);
    const talking = mouthLv.current > 0.05;
    if (mouthOpen.current) {
      mouthOpen.current.visible = talking || e === "happy";
      if (talking) mouthOpen.current.scale.set(0.85 + mouthLv.current * 0.3, 0.2 + mouthLv.current * 1.0, 1);
      else mouthOpen.current.scale.set(1, 1, 1);
    }
    if (ropeG.current) {
      ropeG.current.visible = false; // no hat
      ropeG.current.scale.setScalar(Math.max(0.001, p.rope));
    }
    // muted: a zipper closes over his mouth (left to right) and hides it
    const zipped = p.zip > 0.5;
    if (zipper.current) {
      zipper.current.visible = p.zip > 0.01;
      zipper.current.scale.set(Math.max(0.001, p.zip), 1, 1);
    }
    if (zipped && mouthOpen.current) mouthOpen.current.visible = false;
    if (mouthSmile.current) mouthSmile.current.visible = e === "normal" && !talking && !zipped;
    if (mouthO.current) {
      mouthO.current.visible = !talking && !zipped && (e === "surprised" || e === "dizzy" || e === "effort");
      if (e === "effort") mouthO.current.scale.set(1.9 + Math.sin(t * 22) * 0.08, 0.5, 1); // gritted, straining
      else mouthO.current.scale.setScalar(e === "dizzy" ? 0.8 + Math.sin(t * 8) * 0.12 : 1);
    }

    // Sunglasses slide down from above the head.
    if (shades.current) {
      shades.current.visible = p.shades > 0.01;
      shades.current.position.y = 0.08 + (1 - p.shades) * 1.1;
    }

    // Hand props pop in/out.
    const pop = (g: THREE.Group | null, v: number) => {
      if (!g) return;
      g.visible = v > 0.01;
      g.scale.setScalar(Math.max(0.001, v));
    };
    pop(brushProp.current, p.brush);
    pop(combProp.current, p.comb);

    // Toothpaste foam wobbles around the mouth.
    foamRefs.current.forEach((f, i) => {
      if (!f) return;
      const v = Math.max(0, Math.min(1, p.foam * 1.6 - i * 0.12));
      f.visible = v > 0.01;
      f.scale.setScalar(Math.max(0.001, v * (1 + Math.sin(t * 9 + i * 1.7) * 0.15)));
    });

    // Hair tuft: neat curls, or a messy bed-head that springs about.
    hairRefs.current.forEach((h, i) => {
      if (!h) return;
      const base = (i - 1) * 0.45;
      const messy = p.hair * (i === 1 ? -0.9 : i === 0 ? 1.1 : -1.3);
      const springy = (idle ? Math.sin(t * 3 + i) * 0.05 : 0) + p.hair * Math.sin(t * 14 + i * 2) * 0.12;
      h.rotation.set(p.hair * 0.5 * (i - 1), 0, base + messy + springy);
      h.scale.set(1, 1 + p.hair * 0.35, 1);
    });
  });

  // ---- Geometry ------------------------------------------------------------
  const renderArm = (side: 1 | -1) => (
    <group ref={side < 0 ? shoulderL : shoulderR} position={[side * 0.88, -0.3, 0.12]}>
      <mesh material={mat.limb} castShadow>
        <sphereGeometry args={[0.08, 20, 20]} />
      </mesh>
      <mesh ref={side > 0 ? upperR : undefined} material={mat.limb} position={[0, -0.13, 0]} castShadow>
        <capsuleGeometry args={[0.078, 0.12, 8, 18]} />
      </mesh>
      <group ref={side < 0 ? elbowL : elbowR} position={[0, -0.26, 0]}>
        <mesh material={mat.limb} castShadow>
          <sphereGeometry args={[0.076, 20, 20]} />
        </mesh>
        <mesh material={mat.limb} position={[0, -0.11, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.1, 8, 18]} />
        </mesh>
        <group ref={side > 0 ? wristR : undefined} position={[0, -0.22, 0]} scale={1.25}>
          {side > 0 && (
            <>
              <group ref={brushProp} visible={false}>
                <Toothbrush mat={mat} />
              </group>
              <group ref={combProp} visible={false}>
                <Comb mat={mat} />
              </group>
            </>
          )}
          <GloveHand
            mat={mat}
            side={side}
            onFinger={(i, el) => {
              (side < 0 ? fingersL : fingersR).current[i] = el;
            }}
          />
        </group>
      </group>
    </group>
  );

  const renderLeg = (side: 1 | -1) => (
    <group ref={side < 0 ? hipL : hipR} position={[side * 0.32, -0.86, 0.1]}>
      <mesh material={mat.limb} position={[0, -0.14, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.12, 8, 18]} />
      </mesh>
      <group ref={side < 0 ? kneeL : kneeR} position={[0, -0.28, 0]}>
        <mesh material={mat.limb} castShadow>
          <sphereGeometry args={[0.088, 20, 20]} />
        </mesh>
        <mesh material={mat.limb} position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.1, 8, 18]} />
        </mesh>
        <group ref={side < 0 ? footL : footR} position={[0, -0.26, 0]} scale={1.2}>
          <Sneaker mat={mat} side={side} />
        </group>
      </group>
    </group>
  );

  const renderEye = (side: 0 | 1) => {
    const f = side === 0 ? face.eyeL : face.eyeR;
    return (
      <group position={f.position} quaternion={f.quaternion}>
        <group ref={(g) => void (eyeScale.current[side] = g)} scale={1.4}>
          <SunnyEye mat={mat} gazeRef={side === 0 ? gazeL : gazeR} lidRef={side === 0 ? lidL : lidR} />
        </group>
      </group>
    );
  };

  const renderBrow = (side: 0 | 1) => {
    const f = side === 0 ? face.browL : face.browR;
    return (
      <group position={f.position} quaternion={f.quaternion}>
        <group ref={(g) => void (brows.current[side] = g)}>
          <mesh material={mat.ink} rotation-z={Math.PI / 2 + (side === 0 ? -0.2 : 0.2)}>
            <capsuleGeometry args={[0.016, 0.1, 6, 12]} />
          </mesh>
        </group>
      </group>
    );
  };

  return (
    <group ref={root}>
      {/* Cloud bed + blanket: puffy, glossy white with a little blue shading */}
      <group ref={cloudG} visible={false}>
        {/* [x, y, z, radius, sx, sy, blue?] — soft blue underside, bright white top, flat-ish base */}
        {([
          [-2.2, 0.0, 0, 0.62, 1, 0.85, 1], [-1.4, -0.02, 0.1, 0.78, 1, 0.85, 1], [-0.4, -0.05, 0.1, 0.9, 1, 0.8, 1],
          [0.7, -0.05, 0.1, 0.9, 1, 0.8, 1], [1.7, -0.02, 0.1, 0.78, 1, 0.85, 1], [2.5, 0.0, 0, 0.6, 1, 0.85, 1],
          [-1.6, 0.32, -0.05, 0.6, 1, 0.9, 0], [-0.5, 0.42, -0.05, 0.75, 1, 0.9, 0], [0.7, 0.38, -0.05, 0.7, 1, 0.9, 0], [1.8, 0.28, -0.05, 0.55, 1, 0.9, 0],
          [0.1, 0.0, 0.45, 0.7, 1.2, 0.8, 0],
        ] as number[][]).map(([x, y, z, r, sx, sy, blue], i) => (
          <mesh key={i} position={[x, y, z]} scale={[sx, sy, 1]}>
            <sphereGeometry args={[r, 32, 32]} />
            <meshPhysicalMaterial color={blue ? "#d3e5f8" : "#f6faff"} emissive={blue ? "#bcd6f2" : "#e4f0fc"} emissiveIntensity={0.3} roughness={0.35} clearcoat={0.7} clearcoatRoughness={0.3} />
          </mesh>
        ))}
        {/* blanket puffs over his legs */}
        {[[0.9, 0.85, 0.8, 0.5], [1.7, 0.75, 0.75, 0.45], [0.2, 0.8, 0.85, 0.42]].map(([x, y, z, r], i) => (
          <mesh key={`b${i}`} position={[x, y, z]} scale={[1.2, 0.75, 0.9]}>
            <sphereGeometry args={[r, 24, 24]} />
            <meshPhysicalMaterial color="#f6faff" emissive="#e4f0fc" emissiveIntensity={0.3} roughness={0.35} clearcoat={0.7} clearcoatRoughness={0.3} />
          </mesh>
        ))}
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => void (zRefs.current[i] = g)} visible={false}>
          <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.42, 0.08, 0.06]} /><meshBasicMaterial color="#3b6fd6" /></mesh>
          <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.42, 0.08, 0.06]} /><meshBasicMaterial color="#3b6fd6" /></mesh>
          <mesh rotation={[0, 0, 0.9]}><boxGeometry args={[0.52, 0.08, 0.06]} /><meshBasicMaterial color="#3b6fd6" /></mesh>
        </group>
      ))}
      <group ref={squash} position={[0, GROUND, 0]}>
        <group ref={roll} position={[0, -GROUND, 0]}>
          {/* Rays */}
          {Array.from({ length: RAY_COUNT }, (_, i) => {
            const a = (i / RAY_COUNT) * Math.PI * 2;
            return (
              <group key={i} rotation-z={a}>
                <group ref={(g) => void (rayRefs.current[i] = g)} position-y={0.74}>
                  <mesh
                    geometry={i % 2 === 0 ? rays.long : rays.short}
                    material={rayMat.core}
                    position-z={i % 2 === 0 ? -0.16 : -0.1}
                    castShadow
                  />
                  <mesh
                    geometry={i % 2 === 0 ? rays.longRim : rays.shortRim}
                    material={rayMat.rim}
                    position={[0, -0.02, i % 2 === 0 ? -0.24 : -0.18]}
                  />
                </group>
              </group>
            );
          })}

          {/* Muted = mime Sunny: a little black beret, tipped to one side */}
          <group ref={ropeG} visible={false} position={[0.22, 0.9, 0.2]} rotation={[0.25, 0, -0.38]}>
            <mesh scale={[0.5, 0.16, 0.48]}>
              <sphereGeometry args={[1, 32, 20]} />
              <meshStandardMaterial color="#1f1a1d" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.17, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 0.08, 10]} />
              <meshStandardMaterial color="#1f1a1d" roughness={0.9} />
            </mesh>
          </group>

          {/* Body / face */}
          <mesh material={mat.body} castShadow receiveShadow>
            <sphereGeometry args={[1, 96, 96]} />
          </mesh>

          {renderEye(0)}
          {renderEye(1)}
          {renderBrow(0)}
          {renderBrow(1)}

          {[face.cheekL, face.cheekR].map((f, i) => (
            <group key={i} position={f.position} quaternion={f.quaternion}>
              {/* orange crescent cheek marks */}
              <mesh material={mat.cheek} rotation-z={i === 0 ? 0.6 : -0.6 + Math.PI * 0.1} scale={[1, 1, 0.6]}>
                <torusGeometry args={[0.085, 0.022, 10, 24, Math.PI * 0.9]} />
              </mesh>
            </group>
          ))}

          <mesh material={mat.shoeUpper} position={face.nose.position} quaternion={face.nose.quaternion} scale={[0.055, 0.042, 0.04]}>
            <sphereGeometry args={[1, 16, 16]} />
          </mesh>

          <group position={face.mouth.position} quaternion={face.mouth.quaternion}>
            {/* big open laugh with teeth and tongue */}
            <group ref={mouthOpen} visible={false}>
              <mesh material={mat.ink} rotation-z={Math.PI}>
                <circleGeometry args={[0.2, 40, 0, Math.PI]} />
              </mesh>
              <mesh material={mat.teeth} position={[0, -0.028, 0.004]} rotation-z={Math.PI / 2} scale={[1, 1, 0.3]}>
                <capsuleGeometry args={[0.024, 0.25, 4, 12]} />
              </mesh>
              <mesh material={mat.tongue} position={[0, -0.13, 0.003]} scale={[0.095, 0.055, 1]}>
                <circleGeometry args={[1, 24]} />
              </mesh>
            </group>
            {/* cool lopsided smirk with a peek of tongue */}
            <group ref={mouthSmile} scale={1.3}>
              <mesh material={mat.ink} position={[0.02, 0.04, 0]} rotation-z={Math.PI + 0.28}>
                <torusGeometry args={[0.17, 0.022, 12, 40, Math.PI * 0.78]} />
              </mesh>
              <mesh material={mat.ink} position={[0.13, -0.06, 0.002]} rotation-z={0.5}>
                <circleGeometry args={[0.075, 28, Math.PI * 1.05, Math.PI * 0.95]} />
              </mesh>
              <mesh material={mat.tongue} position={[0.135, -0.1, 0.004]} rotation-z={0.5} scale={[0.045, 0.03, 1]}>
                <circleGeometry args={[1, 24]} />
              </mesh>
              <mesh material={mat.ink} position={[0.215, 0.07, 0]} rotation-z={-0.5}>
                <capsuleGeometry args={[0.014, 0.045, 4, 8]} />
              </mesh>
            </group>
            {/* zipper over the mouth while muted */}
            <group ref={zipper} visible={false} position={[-0.2, -0.01, 0.012]}>
              <group position={[0.2, 0, 0]}>
                <mesh rotation-z={Math.PI / 2}>
                  <capsuleGeometry args={[0.03, 0.36, 6, 16]} />
                  <meshStandardMaterial color="#3a2414" roughness={0.6} />
                </mesh>
                {Array.from({ length: 13 }, (_, i) => (
                  <mesh key={i} position={[-0.18 + i * 0.03, i % 2 ? 0.022 : -0.022, 0.02]}>
                    <boxGeometry args={[0.018, 0.03, 0.02]} />
                    <meshStandardMaterial color="#d9dde3" metalness={0.8} roughness={0.25} />
                  </mesh>
                ))}
                {/* pull tab */}
                <group position={[0.22, 0, 0.03]}>
                  <mesh>
                    <boxGeometry args={[0.05, 0.05, 0.03]} />
                    <meshStandardMaterial color="#d9dde3" metalness={0.8} roughness={0.25} />
                  </mesh>
                  <mesh position={[0, -0.075, 0]}>
                    <boxGeometry args={[0.045, 0.1, 0.018]} />
                    <meshStandardMaterial color="#c3c8cf" metalness={0.8} roughness={0.3} />
                  </mesh>
                  <mesh position={[0, -0.13, 0]}>
                    <torusGeometry args={[0.022, 0.008, 8, 16]} />
                    <meshStandardMaterial color="#c3c8cf" metalness={0.8} roughness={0.3} />
                  </mesh>
                </group>
              </group>
            </group>
            {/* "o" */}
            <group ref={mouthO} visible={false}>
              <mesh material={mat.ink} scale={[0.06, 0.075, 1]}>
                <circleGeometry args={[1, 24]} />
              </mesh>
            </group>
          </group>

          {/* Toothpaste foam */}
          {[
            [-0.17, -0.36],
            [0.16, -0.37],
            [-0.06, -0.47],
            [0.08, -0.46],
            [0.22, -0.3],
          ].map(([x, y], i) => {
            const f = onFace(x, y, 0.03);
            return (
              <group key={i} position={f.position} ref={(g) => void (foamRefs.current[i] = g)} visible={false}>
                <mesh material={mat.teeth} scale={0.045 + (i % 2) * 0.015}>
                  <sphereGeometry args={[1, 14, 12]} />
                </mesh>
              </group>
            );
          })}

          {/* Little curly hair tuft on top */}
          <group position={[0, 0.9, 0.36]} rotation-x={-0.45}>
            {[0, 1, 2].map((i) => (
              <group key={i} ref={(g) => void (hairRefs.current[i] = g)} position={[(i - 1) * 0.09, 0, 0]}>
                <mesh material={mat.rayA} position={[0, 0.1, 0]} rotation-z={Math.PI * 0.15}>
                  <torusGeometry args={[0.09, 0.032, 12, 28, Math.PI * 1.35]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Sunglasses prop */}
          <group ref={shades} position={[0, 1.2, 1.12]} visible={false}>
            <Sunglasses mat={mat} />
          </group>

          {renderArm(-1)}
          {renderArm(1)}
          {renderLeg(-1)}
          {renderLeg(1)}
        </group>
      </group>
    </group>
  );
}
