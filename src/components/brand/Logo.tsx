import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/data/site";
import { ProposedWordmark } from "./ProposedWordmark";

/**
 * Uses the original Brightsun SEO logo file when it is present in
 * public/brand/. The logo is never redrawn: until the file is added, a
 * separate, clearly proposed wordmark treatment is shown instead.
 */
const CANDIDATES = ["brightsun-logo.svg", "brightsun-logo.png", "brightsun-logo.webp"];

function findLogo() {
  for (const file of CANDIDATES) {
    if (fs.existsSync(path.join(process.cwd(), "public", "brand", file))) return `/brand/${file}`;
  }
  return null;
}

export function Logo({ className = "h-9 w-auto md:h-10" }: { className?: string }) {
  const src = findLogo();
  if (!src) {
    return <ProposedWordmark />;
  }
  // Plain <img> so the original artwork is shown exactly as supplied.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={siteConfig.name} className={className} />;
}
