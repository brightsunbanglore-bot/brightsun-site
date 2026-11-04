"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type ScrubWordsProps = {
  text: string;
  className?: string;
  as?: "p" | "h2" | "h3";
};

/**
 * Editorial "reading" effect: words brighten from faint to full ink as the
 * paragraph scrolls through the viewport. Static for reduced motion.
 */
export function ScrubWords({ text, className, as = "p" }: ScrubWordsProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;
  const words = text.split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} data-word className="inline-block">
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
