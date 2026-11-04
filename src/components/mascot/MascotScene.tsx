"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { MathUtils, NeutralToneMapping } from "three";
import { SunnyCharacter } from "./SunnyCharacter";
import { GROUND, type Rig } from "./sunnyPose";
import { BRAND } from "./palette";
import { mascotState } from "./mascotState";

/** Subtle camera: slow dolly-in on entrance, light pointer parallax, gentle pull-back on scroll. */
function CameraDrift({ reducedMotion, fixed }: { reducedMotion: boolean; fixed: boolean }) {
  const start = useRef<number | null>(null);
  useFrame((state, delta) => {
    const cam = state.camera;
    if (fixed) {
      // scripted scenes: a locked camera so on-screen positions map exactly to world units
      cam.position.set(0, 0.3, 9.2);
      cam.lookAt(0, -0.12, 0);
      return;
    }
    if (reducedMotion) {
      cam.position.set(0, 0.25, 9.2);
      cam.lookAt(0, -0.12, 0);
      return;
    }
    const t = state.clock.elapsedTime;
    if (start.current === null) start.current = t;
    const intro = Math.min(1, (t - start.current) / 3.2);
    const ease = 1 - Math.pow(1 - intro, 3);
    const d = Math.min(delta, 1 / 30);
    const z = 10.6 - ease * 1.4 + mascotState.scroll * 0.9;
    const calmLook = 1 - Math.min(1, mascotState.scroll * 3); // no cursor drift once the hero scrolls away
    const x = mascotState.pointerX * 0.35 * calmLook;
    const y = 0.7 - ease * 0.4 + mascotState.pointerY * 0.2 * calmLook;
    cam.position.set(MathUtils.damp(cam.position.x, x, 2.5, d), MathUtils.damp(cam.position.y, y, 2.5, d), z);
    cam.lookAt(0, -0.12, 0);
  });
  return null;
}

/**
 * When Sunny shrinks into the scroll companion the canvas is shown far
 * smaller than its layout size, so render it at a lower pixel ratio.
 */
function DprByMode() {
  const setDpr = useThree((s) => s.setDpr);
  const initialDpr = useThree((s) => s.viewport.initialDpr);
  const mode = useRef(mascotState.mode);
  useFrame(() => {
    if (mascotState.mode === mode.current) return;
    mode.current = mascotState.mode;
    setDpr(mode.current === "mini" ? 0.6 : initialDpr);
  });
  return null;
}

export type MascotSceneProps = {
  lite: boolean;
  compact: boolean;
  reducedMotion: boolean;
  active: boolean;
  onReady: () => void;
  rig?: Rig;
  fixedCamera?: boolean;
};

/** Controlled WebGL canvas for Sunny, the hero mascot. Lazy-loaded, client-only. */
export default function MascotScene({ lite, compact, reducedMotion, active, onReady, rig, fixedCamera = false }: MascotSceneProps) {
  return (
    <Canvas
      dpr={lite ? [1, 1.5] : [1, 2]}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      camera={{ position: [0, 0.7, 11], fov: 28, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: NeutralToneMapping }}
      // Never intercept clicks — the stage element handles interaction.
      style={{ pointerEvents: "none" }}
      // Measure layout size (offsetWidth/Height), not the on-screen size: the
      // homepage companion shrinks the stage with a CSS transform, and the
      // canvas must not shrink a second time.
      resize={{ offsetSize: true, scroll: false }}
    >
      <ambientLight intensity={0.6} />
      <hemisphereLight args={[BRAND.ivory, BRAND.sun, 0.45]} />
      <directionalLight position={[-3, 6, 6]} intensity={2.1} />
      <directionalLight position={[4, 2, -4]} intensity={0.8} color={BRAND.ivory} />
      {/* Soft studio reflections, rendered locally (no external HDR). */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.8} position={[0, 5, 3]} rotation-x={Math.PI / 2.4} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.9} position={[-5, 0, 3]} rotation-y={Math.PI / 2.5} scale={[2, 6, 1]} color={BRAND.ivory} />
        <Lightformer form="rect" intensity={0.6} position={[5, 0, 2]} rotation-y={-Math.PI / 2.5} scale={[2, 6, 1]} color={BRAND.cream} />
      </Environment>

      <CameraDrift reducedMotion={reducedMotion} fixed={fixedCamera} />
      <DprByMode />
      <Suspense fallback={null}>
        <SunnyCharacter reducedMotion={reducedMotion} compact={compact} onReady={onReady} rig={rig} />
      </Suspense>

      <ContactShadows
        position={[0, GROUND - 0.01, 0]}
        opacity={0.35}
        scale={7}
        blur={2.4}
        far={2.5}
        resolution={lite ? 256 : 512}
        frames={reducedMotion ? 1 : Infinity}
        color={BRAND.espresso}
      />
      <AdaptiveDpr />
    </Canvas>
  );
}
