import { hero } from "@/data/home";

/** Small icons for the highlight chips. */
const ICONS = [
  // rising bars
  <svg key="a" viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
    <rect x="3" y="20" width="5" height="9" rx="2" fill="#FFC233" />
    <rect x="11" y="15" width="5" height="14" rx="2" fill="#FFC233" />
    <rect x="19" y="10" width="5" height="19" rx="2" fill="#FF8A1D" />
    <path d="M4 13 12 8l5 3 9-7" stroke="#FF8A1D" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  // eye / visibility
  <svg key="b" viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
    <path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z" fill="#FFC233" />
    <circle cx="16" cy="16" r="4.5" fill="#FF8A1D" />
  </svg>,
  // target
  <svg key="c" viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
    <circle cx="16" cy="16" r="12" fill="#FF8A1D" />
    <circle cx="16" cy="16" r="8" fill="#FFFDF7" />
    <circle cx="16" cy="16" r="4" fill="#FFC233" />
  </svg>,
];

/** Highlight chips placed around the mascot; each has its own parallax depth. */
export function HeroChips() {
  const spots = [
    "left-[2%] top-[8%] -rotate-6 md:left-[0%] md:top-[10%]",
    "right-[0%] top-[22%] rotate-6 md:right-[-2%] md:top-[18%]",
    "right-[4%] bottom-[18%] -rotate-3 hidden sm:flex",
  ];
  return (
    <>
      {hero.highlights.map((label, i) => (
        <div
          key={label}
          data-hero-float
          data-depth={18 + i * 10}
          className={`pointer-events-none absolute z-20 flex items-center gap-2.5 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-[0_14px_30px_-16px_rgba(35,27,24,0.35)] backdrop-blur ${spots[i]}`}
        >
          {ICONS[i]}
          <span className="text-sm font-semibold leading-tight text-espresso">{label}</span>
        </div>
      ))}
    </>
  );
}

/** Hand-drawn doodles: sparkle strokes and a loop, orange/yellow line work. */
export function HeroDoodles() {
  return (
    <>
      <svg
        data-hero-float
        data-depth="34"
        viewBox="0 0 60 60"
        aria-hidden
        className="pointer-events-none absolute left-[-2%] top-[30%] z-10 hidden h-12 w-12 lg:block"
      >
        <path d="M30 6v14M12 16l9 9M48 16l-9 9" stroke="#FFC233" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <svg
        data-hero-float
        data-depth="26"
        viewBox="0 0 140 60"
        aria-hidden
        className="pointer-events-none absolute bottom-[26%] left-[0%] z-10 hidden h-12 w-28 md:block"
      >
        <path
          d="M4 44c26 8 52 6 68-6 14-11 8-30-6-26-16 5-8 32 16 34 22 2 40-6 54-16"
          stroke="#FF8A1D"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

/** Soft golden hill the mascot stands on (flat fills, no gradient). */
export function HeroHill() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 300"
      preserveAspectRatio="none"
      className="pointer-events-none absolute bottom-0 right-0 h-[30%] w-full lg:h-[40%] lg:w-[62%]"
    >
      <path d="M0 300V190C150 120 300 70 470 80 610 88 720 130 800 170v130Z" fill="#FFF3DC" />
      <path d="M140 300c80-90 200-140 330-136 130 4 230 60 330 120v16Z" fill="#FFC233" opacity="0.85" />
    </svg>
  );
}
