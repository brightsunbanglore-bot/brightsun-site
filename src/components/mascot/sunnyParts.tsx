"use client";

import * as THREE from "three";
import type { RefObject } from "react";

/**
 * Detailed body parts for Sunny: realistic eyes, cartoon glove hands and
 * proper sneakers. Geometry is built once and shared between left/right.
 */

export type SunnyMaterials = {
  body: THREE.Material;
  limb: THREE.Material;
  glove: THREE.Material;
  rayA: THREE.Material;
  rayB: THREE.Material;
  sclera: THREE.Material;
  iris: THREE.Material;
  pupil: THREE.Material;
  shine: THREE.Material;
  ink: THREE.Material;
  cheek: THREE.Material;
  tongue: THREE.Material;
  teeth: THREE.Material;
  shoeUpper: THREE.Material;
  shoeAccent: THREE.Material;
  midsole: THREE.Material;
  outsole: THREE.Material;
  lens: THREE.Material;
  frame: THREE.Material;
  glint: THREE.Material;
  temple: THREE.Material;
};

// ---------------------------------------------------------------------------
// Shared geometry (lazy singletons)

let cache: {
  sole: THREE.ExtrudeGeometry;
  outsole: THREE.ExtrudeGeometry;
  upper: THREE.SphereGeometry;
  irisCap: THREE.SphereGeometry;
  pupilCap: THREE.SphereGeometry;
  lid: THREE.SphereGeometry;
  lash: THREE.TorusGeometry;
} | null = null;

/** Catch-light sparkles: flat discs lying on the eyeball surface (r ≈ 0.156). */
const SPARKLES = (
  [
    [0.0446, 0.0492, 0.1412, 0.03],
    [-0.0354, -0.0411, 0.1463, 0.014],
    [0.0123, 0.0711, 0.1383, 0.009],
  ] as const
).map(([x, y, z, size]) => {
  const p = new THREE.Vector3(x, y, z);
  return {
    position: p.toArray() as [number, number, number],
    quaternion: new THREE.Quaternion()
      .setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize())
      .toArray() as [number, number, number, number],
    scale: [size, size, size * 0.3] as [number, number, number],
  };
});

/** Sneaker footprint: wide rounded toe, narrower heel (toe towards +y). */
function footprint(scale = 1) {
  const s = new THREE.Shape();
  const k = scale;
  s.moveTo(0, -0.2 * k);
  s.bezierCurveTo(0.1 * k, -0.2 * k, 0.105 * k, -0.1 * k, 0.105 * k, 0);
  s.bezierCurveTo(0.105 * k, 0.12 * k, 0.135 * k, 0.2 * k, 0.13 * k, 0.29 * k);
  s.bezierCurveTo(0.125 * k, 0.43 * k, -0.125 * k, 0.43 * k, -0.13 * k, 0.29 * k);
  s.bezierCurveTo(-0.135 * k, 0.2 * k, -0.105 * k, 0.12 * k, -0.105 * k, 0);
  s.bezierCurveTo(-0.105 * k, -0.1 * k, -0.1 * k, -0.2 * k, 0, -0.2 * k);
  return s;
}

function parts() {
  if (cache) return cache;
  const extrude = (depth: number, bevel: number, scale: number) => {
    const g = new THREE.ExtrudeGeometry(footprint(scale), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelSegments: 4,
      curveSegments: 28,
    });
    // Lay flat: footprint in XZ (toe → +z), thickness going down from y = 0.
    g.rotateX(Math.PI / 2);
    return g;
  };
  cache = {
    sole: extrude(0.05, 0.022, 1),
    outsole: extrude(0.012, 0.008, 1.02),
    // Top hemisphere, scaled into the shoe upper.
    upper: new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    // Spherical caps that sit on the eyeball (around +y, rotated to face +z).
    irisCap: new THREE.SphereGeometry(0.1525, 40, 12, 0, Math.PI * 2, 0, 0.68),
    pupilCap: new THREE.SphereGeometry(0.1535, 32, 8, 0, Math.PI * 2, 0, 0.38),
    // Eyelid shell (top hemisphere, rotated to blink). Sits just outside the
    // flattened catch-lights so a closed eye fully hides them.
    lid: new THREE.SphereGeometry(0.168, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    // Lash line across the lid: reads as a closed eye when the lid is shut.
    lash: new THREE.TorusGeometry(0.17, 0.011, 8, 40, Math.PI * 0.7),
  };
  return cache;
}

// ---------------------------------------------------------------------------

/**
 * Realistic cartoon eye: glossy eyeball, warm-brown iris, pupil and catch
 * lights on a gaze group (rotates to follow the cursor), and a skin-coloured
 * eyelid that blinks / squints.
 */
export function SunnyEye({
  mat,
  gazeRef,
  lidRef,
}: {
  mat: SunnyMaterials;
  gazeRef: RefObject<THREE.Group | null>;
  lidRef: RefObject<THREE.Group | null>;
}) {
  const g = parts();
  return (
    <group>
      <mesh material={mat.sclera}>
        <sphereGeometry args={[0.15, 40, 40]} />
      </mesh>
      <group ref={gazeRef}>
        <mesh geometry={g.irisCap} material={mat.iris} rotation-x={Math.PI / 2} />
        <mesh geometry={g.pupilCap} material={mat.pupil} rotation-x={Math.PI / 2} />
        {SPARKLES.map((s, i) => (
          <mesh key={i} material={mat.shine} position={s.position} quaternion={s.quaternion} scale={s.scale}>
            <sphereGeometry args={[1, 12, 12]} />
          </mesh>
        ))}
      </group>
      {/* Upper eyelid in body colour: rotation.x -1 (open) → 1.57 (closed). */}
      <group ref={lidRef} rotation-x={-1}>
        <mesh geometry={g.lid} material={mat.body} />
        <mesh geometry={g.lash} material={mat.ink} rotation-z={Math.PI / 2 - Math.PI * 0.35} />
      </group>
    </group>
  );
}

/**
 * Four-finger cartoon glove with a rolled cuff. Fingers curl by `grip`
 * (applied by the parent through the finger refs).
 */
export function GloveHand({
  mat,
  side,
  onFinger,
}: {
  mat: SunnyMaterials;
  side: 1 | -1;
  /** Registers finger pivots (0–2 fingers, 3 thumb) with the parent rig. */
  onFinger: (index: number, el: THREE.Group | null) => void;
}) {
  const fingers = [-0.045, 0, 0.045];
  return (
    <group>
      {/* cuff */}
      <mesh material={mat.glove} rotation-x={Math.PI / 2} position={[0, 0.01, 0]}>
        <torusGeometry args={[0.058, 0.028, 14, 28]} />
      </mesh>
      {/* palm */}
      <mesh material={mat.glove} position={[0, -0.09, 0]} scale={[0.085, 0.09, 0.055]}>
        <sphereGeometry args={[1, 24, 20]} />
      </mesh>
      {/* three fingers */}
      {fingers.map((x, i) => (
        <group
          key={i}
          ref={(el) => onFinger(i, el)}
          position={[x * 1.1, -0.15, 0.005]}
          rotation-z={x * -1.6}
        >
          <mesh material={mat.glove} position={[0, -0.055, 0]}>
            <capsuleGeometry args={[0.026, 0.07 - Math.abs(x) * 0.3, 6, 12]} />
          </mesh>
        </group>
      ))}
      {/* thumb */}
      <group
        ref={(el) => onFinger(3, el)}
        position={[side * -0.075, -0.08, 0.03]}
        rotation-z={side * -0.9}
      >
        <mesh material={mat.glove} position={[0, -0.045, 0]}>
          <capsuleGeometry args={[0.026, 0.05, 6, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Sneaker: rubber outsole, chunky midsole, orange upper with toe cap,
 * heel counter, tongue, laces and padded collar. Origin = ankle.
 */
export function Sneaker({ mat, side }: { mat: SunnyMaterials; side: 1 | -1 }) {
  const g = parts();
  const solesTop = -0.13;
  return (
    <group position={[side * 0.01, 0, 0.03]}>
      {/* soles */}
      <mesh geometry={g.sole} material={mat.midsole} position={[0, solesTop, 0]} castShadow receiveShadow />
      <mesh geometry={g.outsole} material={mat.outsole} position={[0, solesTop - 0.072, 0]} castShadow />
      {/* upper */}
      <mesh geometry={g.upper} material={mat.shoeUpper} position={[0, solesTop, 0.08]} scale={[0.122, 0.15, 0.28]} castShadow />
      {/* toe cap */}
      <mesh geometry={g.upper} material={mat.shoeAccent} position={[0, solesTop, 0.26]} scale={[0.118, 0.085, 0.12]} />
      {/* heel counter */}
      <mesh geometry={g.upper} material={mat.shoeAccent} position={[0, solesTop, -0.12]} scale={[0.112, 0.12, 0.09]} />
      {/* tongue */}
      <mesh material={mat.shoeUpper} position={[0, 0.0, 0.07]} rotation-x={-0.5} scale={[0.065, 0.02, 0.09]}>
        <sphereGeometry args={[1, 20, 12]} />
      </mesh>
      {/* laces */}
      {[0.06, 0.12, 0.18].map((z, i) => (
        <mesh key={z} material={mat.midsole} position={[0, -0.005 - i * 0.03, z]} rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[0.012, 0.1, 4, 8]} />
        </mesh>
      ))}
      {/* padded collar */}
      <mesh material={mat.shoeAccent} position={[0, 0.0, -0.03]} rotation-x={Math.PI / 2 - 0.25}>
        <torusGeometry args={[0.072, 0.03, 14, 28]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Cool sunglasses: chunky dark frames, tinted lenses with zig-zag glints and
// teal arms that wrap back around the head.

let shadesCache: {
  frame: THREE.ExtrudeGeometry;
  glass: THREE.ExtrudeGeometry;
  glint: THREE.ShapeGeometry;
  bridge: THREE.TorusGeometry;
  temples: [THREE.TubeGeometry, THREE.TubeGeometry];
} | null = null;

/** Lens outline: flatter, wider top; local +x is the outer side. */
function lensShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.17, 0.09);
  s.bezierCurveTo(-0.08, 0.13, 0.1, 0.13, 0.2, 0.1);
  s.bezierCurveTo(0.26, 0.07, 0.25, -0.04, 0.19, -0.1);
  s.bezierCurveTo(0.1, -0.17, -0.06, -0.17, -0.14, -0.1);
  s.bezierCurveTo(-0.21, -0.04, -0.22, 0.06, -0.17, 0.09);
  return s;
}

/** Lightning-style reflection across each lens. */
function glintShape() {
  const pts: [number, number][] = [
    [-0.11, 0.05], [-0.06, 0.0], [-0.03, 0.07], [0.01, -0.01], [0.05, 0.06], [0.09, -0.02],
    [0.12, 0.03], [0.08, -0.07], [0.04, -0.01], [0.0, -0.08], [-0.03, -0.01], [-0.07, -0.06],
  ];
  const s = new THREE.Shape();
  s.moveTo(...pts[0]);
  pts.slice(1).forEach((pt) => s.lineTo(...pt));
  s.closePath();
  return s;
}

function shadesParts() {
  if (shadesCache) return shadesCache;
  const temple = (side: 1 | -1) =>
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.66, 0.1, -0.2),
        new THREE.Vector3(side * 0.76, 0.12, -0.36),
        new THREE.Vector3(side * 0.86, 0.12, -0.6),
        new THREE.Vector3(side * 0.97, 0.12, -1.0),
      ]),
      24,
      0.024,
      10,
    );
  shadesCache = {
    frame: new THREE.ExtrudeGeometry(lensShape(), {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.022,
      bevelSegments: 4,
      curveSegments: 32,
    }),
    glass: new THREE.ExtrudeGeometry(lensShape(), {
      depth: 0.01,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: -0.004,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    glint: new THREE.ShapeGeometry(glintShape()),
    bridge: new THREE.TorusGeometry(0.06, 0.026, 10, 20, Math.PI),
    temples: [temple(-1), temple(1)],
  };
  return shadesCache;
}

/** Sunglasses (worn by default; slide up off the face for gags). */
export function Sunglasses({ mat }: { mat: SunnyMaterials }) {
  const g = shadesParts();
  return (
    <group>
      {([-1, 1] as const).map((s, i) => (
        <group key={s}>
          <group position={[s * 0.34, 0, 0]} rotation-y={s * 0.3} scale={[s * 1.45, 1.45, 1.2]}>
            <mesh geometry={g.frame} material={mat.frame} position-z={-0.03} scale={1.06} />
            <mesh geometry={g.glass} material={mat.lens} position-z={0.012} />
            <mesh geometry={g.glint} material={mat.glint} position={[0.02, 0, 0.045]} rotation-z={-0.35} />
          </group>
          <mesh geometry={g.temples[i]} material={mat.temple} />
        </group>
      ))}
      <mesh geometry={g.bridge} material={mat.frame} position={[0, 0.06, 0]} />
    </group>
  );
}

/** Toothbrush held across the fist; bristle head at -x (towards the mouth). */
export function Toothbrush({ mat }: { mat: SunnyMaterials }) {
  return (
    <group position={[-0.02, -0.1, 0.07]}>
      <mesh material={mat.shoeUpper} rotation-z={Math.PI / 2}>
        <capsuleGeometry args={[0.022, 0.3, 6, 12]} />
      </mesh>
      <mesh material={mat.shoeUpper} position={[-0.19, 0, 0]} scale={[0.07, 0.03, 0.03]}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      {/* bristles */}
      <mesh material={mat.midsole} position={[-0.19, 0.035, 0]}>
        <boxGeometry args={[0.11, 0.045, 0.045]} />
      </mesh>
      {/* blob of paste */}
      <mesh material={mat.teeth} position={[-0.19, 0.07, 0]} scale={[0.05, 0.022, 0.025]}>
        <sphereGeometry args={[1, 12, 10]} />
      </mesh>
    </group>
  );
}

/** Pocket comb held across the fist, teeth pointing up. */
export function Comb({ mat }: { mat: SunnyMaterials }) {
  return (
    <group position={[-0.06, -0.08, 0.07]}>
      <mesh material={mat.outsole}>
        <boxGeometry args={[0.32, 0.05, 0.018]} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} material={mat.outsole} position={[-0.15 + i * 0.03, 0.055, 0]}>
          <boxGeometry args={[0.012, 0.07, 0.014]} />
        </mesh>
      ))}
    </group>
  );
}
