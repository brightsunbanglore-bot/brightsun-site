"use client";

import { useState } from "react";
import type { CaseStudy } from "@/data/caseStudies";

/**
 * A client's original logo. Tries a local file first (`/clients/<slug>.png`,
 * `.webp`, `.svg`), then the logo URL from the client's site, then falls back
 * to the brand name so the layout never shows a broken image.
 */
export function ClientLogo({ study, className = "", mini = false, eager = false }: { study: CaseStudy; className?: string; mini?: boolean; eager?: boolean }) {
  const sources = [
    `/clients/${study.slug}.svg`,
    `/clients/${study.slug}.png`,
    `/clients/${study.slug}.webp`,
    ...(study.logo ? [study.logo] : []),
  ];
  const [i, setI] = useState(0);
  if (i >= sources.length) {
    if (mini) return <span aria-hidden className="font-hero text-base font-extrabold text-flame">{study.name[0]}</span>;
    return <span className={`font-hero text-lg font-extrabold tracking-tight text-espresso ${className}`}>{study.name}</span>;
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[i]}
      alt={`${study.name} logo`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setI((n) => n + 1)}
      className={`object-contain ${study.logoOn === "dark" ? "max-h-full max-w-full" : className}`}
    />
  );
  // White logos sit on a dark chip so they stay visible on the white tiles.
  return study.logoOn === "dark" ? (
    <span className={`inline-flex items-center justify-center rounded-lg bg-espresso px-2.5 py-1.5 ${className.includes("max-h-6") ? "h-7 w-9 px-1 py-1" : "h-11 w-[88px]"}`}>{img}</span>
  ) : (
    img
  );
}
