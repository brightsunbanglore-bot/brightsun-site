/**
 * PROPOSED playful wordmark treatment (type only) — shown in place of the
 * original logo until the original file is added to public/brand/.
 * It does not alter or replace the original logo artwork.
 */
export function ProposedWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`} aria-label="BrightSun SEO">
      <span aria-hidden className="font-hero text-[1.55rem] font-extrabold tracking-[-0.04em] text-espresso md:text-[1.75rem]">
        Bright<span className="text-flame">Sun</span>
      </span>
      <span aria-hidden className="mt-0.5 self-end text-[0.62rem] font-bold tracking-[0.55em] text-espresso/80">
        SEO
      </span>
    </span>
  );
}
