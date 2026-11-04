"use client";

import { useState } from "react";
import type { CaseStudy } from "@/data/caseStudies";
import { ClientLogo } from "./ClientLogo";

/**
 * The client's homepage in a browser frame. A clean local screenshot
 * (`/public/clients/<slug>-home.png|jpg|webp`, made by `npm run capture:homepages`
 * with popups/ads removed) always wins; otherwise the public page is shown as
 * it currently appears; failing that, a branded frame.
 */
export function SitePreview({ study }: { study: CaseStudy }) {
  const sources = [`/clients/${study.slug}-home.png`, `/clients/${study.slug}-home.jpg`, `/clients/${study.slug}-home.webp`,
    // Fallback: the public page as it is currently visible (may include its own popups).
    ...(study.url ? [`https://s0.wp.com/mshots/v1/${encodeURIComponent(study.url)}?w=1280&h=800`] : []),
  ];
  const [i, setI] = useState(0);
  return (
    <div data-site className="overflow-hidden rounded-2xl bg-espresso shadow-[0_30px_60px_-30px_rgba(35,27,24,0.7)]">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 min-w-0 flex-1 truncate rounded-full bg-ivory/10 px-3 py-1 text-xs text-ivory/70">{study.domain ?? study.name}</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden bg-ivory">
        {i < sources.length ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-site-img
            src={sources[i]}
            alt={`${study.name} homepage`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setI((n) => n + 1)}
            className="absolute inset-x-0 top-0 h-auto w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_30%_20%,#FFF1C2,#FFFDF7_60%)]">
            <ClientLogo study={study} className="max-h-16 max-w-[60%]" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-espresso/40">{study.domain ?? study.sector}</span>
          </div>
        )}
        <span data-site-scan aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-sun/40 to-transparent opacity-0" />
      </div>
    </div>
  );
}
