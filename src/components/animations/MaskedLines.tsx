"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

type Tag = "h1" | "h2" | "h3" | "p" | "div";

type MaskedLinesProps = {
  as?: Tag;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** ScrollTrigger start position. */
  start?: string;
  id?: string;
};

/**
 * Splits text into lines, each inside an overflow mask, and lifts the
 * lines into view when the block enters the viewport. Re-splits on
 * resize (autoSplit). Plain text for reduced-motion users.
 */
export function MaskedLines({ as = "h2", children, className, delay = 0, start = "top 85%", id }: MaskedLinesProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "masked-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              rotate: 2,
              transformOrigin: "0% 100%",
              duration: 1.4,
              ease: "expo.out",
              stagger: 0.085,
              delay,
              scrollTrigger: { trigger: el, start, once: true },
            }),
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [delay, start] },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
