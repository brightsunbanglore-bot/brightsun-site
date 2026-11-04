import { BRAND } from "./palette";

/**
 * Lightweight flat stand-in for the 3D mascot (same character traits:
 * round face, rounded rays, eyes, nose, smile, cheeks, arms and legs).
 * Shown while WebGL loads, on WebGL failure, and on very slow devices.
 */
export function MascotFallback({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 11 }, (_, i) => (i / 11) * 360);
  return (
    <svg viewBox="0 0 400 440" className={className} aria-hidden focusable="false">
      <ellipse cx="200" cy="420" rx="110" ry="10" fill={BRAND.espresso} opacity="0.1" />
      {/* legs + shoes */}
      <rect x="160" y="300" width="22" height="80" rx="11" fill={BRAND.sun} />
      <rect x="218" y="300" width="22" height="80" rx="11" fill={BRAND.sun} />
      <ellipse cx="168" cy="392" rx="34" ry="18" fill={BRAND.flame} />
      <ellipse cx="232" cy="392" rx="34" ry="18" fill={BRAND.flame} />
      {/* rays */}
      {rays.map((deg, i) => (
        <ellipse
          key={i}
          cx="200"
          cy="62"
          rx="34"
          ry="40"
          fill={i % 3 === 1 ? BRAND.sun : BRAND.flame}
          transform={`rotate(${deg} 200 200)`}
        />
      ))}
      {/* arms */}
      <path d="M80 214 Q 52 170 66 128" stroke={BRAND.sun} strokeWidth="20" strokeLinecap="round" fill="none" />
      <circle cx="66" cy="120" r="20" fill={BRAND.sun} />
      <path d="M320 220 Q 350 250 344 284" stroke={BRAND.sun} strokeWidth="20" strokeLinecap="round" fill="none" />
      <circle cx="344" cy="290" r="18" fill={BRAND.sun} />
      {/* face */}
      <circle cx="200" cy="200" r="132" fill={BRAND.sun} />
      <path d="M150 158 q16 -8 32 0 M218 158 q16 -8 32 0" stroke={BRAND.espresso} strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="166" cy="190" rx="12" ry="16" fill={BRAND.espresso} />
      <ellipse cx="234" cy="190" rx="12" ry="16" fill={BRAND.espresso} />
      <circle cx="162" cy="184" r="4" fill="#FFFFFF" />
      <circle cx="230" cy="184" r="4" fill="#FFFFFF" />
      <ellipse cx="200" cy="212" rx="9" ry="7" fill={BRAND.flame} />
      <ellipse cx="128" cy="226" rx="24" ry="16" fill={BRAND.flame} opacity="0.35" />
      <ellipse cx="272" cy="226" rx="24" ry="16" fill={BRAND.flame} opacity="0.35" />
      <path d="M164 236 q36 30 72 0" stroke={BRAND.espresso} strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}
