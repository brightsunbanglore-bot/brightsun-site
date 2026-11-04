"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register plugins once, client-side only.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/** House easing: long, soft decelerations. */
export const EASE = {
  out: "expo.out",
  inOut: "power3.inOut",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
