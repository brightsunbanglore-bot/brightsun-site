"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoIntro } from "@/components/brand/LogoIntro";
import { holdSunny } from "@/components/mascot/sunnyAudio";
import { mascotState } from "@/components/mascot/mascotState";

/**
 * Cinematic logo intro that opens the site once per visit, on whichever page the visitor lands on first (not on a refresh, and not again while browsing). "Skip intro" and the
 * "Meet Sunny" button fade it away and reveal the site. While it is on screen Sunny's own
 * hello stays quiet (clicks during the intro don't trigger it); it starts when the intro ends.
 */
// Plays only when the visitor ARRIVES at the site (typed address, bookmark, link from Google or elsewhere).
// It stays away on a refresh, on back/forward, and while moving around the site.
// `introSeen` survives client-side navigation (Home -> Services -> Home) because the layout never reloads.
let introSeen = false;
const readSeen = () => {
  if (introSeen) return true;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && (nav.type === "reload" || nav.type === "back_forward")) return true;
    if (document.referrer && new URL(document.referrer).origin === location.origin) return true; // a full page load from inside the site
  } catch {
    /* if the browser can't tell, treat it as an arrival */
  }
  return false;
};
const markSeen = () => {
  introSeen = true;
};

export function HomeIntro() {
  const pathname = usePathname();
  const review = pathname.startsWith("/logo-intro") || pathname.startsWith("/admin"); // review page plays its own copy; the admin area never shows the intro
  // when coming back to Home inside the site the intro never plays again
  const [phase, setPhase] = useState<"pending" | "playing" | "leaving" | "off">(() => (introSeen ? "off" : "pending"));

  useEffect(() => {
    if (review) return;
    if (readSeen()) {
      setPhase("off");
      return;
    }
    holdSunny(true);
    setPhase("playing");
    return () => holdSunny(false);
  }, [review]);

  useEffect(() => {
    if (phase === "leaving") {
      markSeen(); // from now on the intro stays away for this visit
      holdSunny(false);
      // the cursor is sitting on the intro button: keep Sunny facing front until the mouse moves on
      mascotState.pointerX = 0;
      mascotState.pointerY = 0;
      mascotState.pointerFrozen = true;
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "leaving") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = setTimeout(() => setPhase("off"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  if (review || phase === "off") return null;
  if (phase === "pending") return <div aria-hidden data-intro-cover className="fixed inset-0 z-[200] bg-ivory" />;

  return (
    <div className={`transition-opacity duration-700 ${phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <LogoIntro
        speed={1.5}
        onSkip={() => setPhase("leaving")}
        cta={
          <button
            type="button"
            onClick={() => setPhase("leaving")}
            className="rounded-full bg-espresso px-8 py-3.5 text-sm font-semibold text-ivory shadow-[0_18px_40px_-18px_rgba(35,27,24,0.7)] transition hover:-translate-y-0.5 hover:bg-espresso/90"
          >
            Click here to meet Sunny
          </button>
        }
      />
    </div>
  );
}
