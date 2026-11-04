"use client";

import { Suspense } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";

type SceneCanvasProps = Omit<CanvasProps, "children"> & {
  children: React.ReactNode;
};

/**
 * Shared R3F canvas wrapper: sensible defaults for performance
 * (capped DPR, adaptive resolution, transparent background).
 * Any prop can be overridden per scene.
 */
export function SceneCanvas({ children, ...props }: SceneCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      {...props}
    >
      <Suspense fallback={null}>
        {children}
        <Preload all />
      </Suspense>
      <AdaptiveDpr />
    </Canvas>
  );
}
