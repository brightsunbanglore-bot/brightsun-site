"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { quietSunny, uiTap } from "@/components/mascot/sunnyAudio";

/**
 * Moving between pages from the menu: a soft, normal tap, and Sunny stays quiet for the first few seconds on the new page
 * (no funny sounds, no voice). The very first arrival on the site is unchanged.
 */
export function NavSound() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    quietSunny(8000);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      uiTap();
    };
    document.addEventListener("click", onClick, true); // before the links handle the click
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
