"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type ClipRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

/**
 * Section transition: the section opens from an inset, rounded "frame"
 * to full bleed as it scrolls into view.
 */
export function ClipReveal({ children, className = "", ...rest }: ClipRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { clipPath: "inset(7% 4% 0% 4% round 32px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "top 15%", scrub: 0.5 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className={className} {...rest}>
      {children}
    </section>
  );
}
