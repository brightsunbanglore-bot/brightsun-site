"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Fixed header in its own top layer, above all page content (incl. WebGL).
 * Always visible; gains an ivory backdrop once the page is scrolled.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // pages that open on a dark screen: light logo and menu until the ivory backdrop appears
  const dark = !scrolled && (pathname.startsWith("/about") || pathname.startsWith("/contact") || pathname === "/blogs");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`${dark ? "hdr-dark " : ""}fixed inset-x-0 top-0 z-[100] isolate transition-[border-color] duration-500 ${
        scrolled ? "border-b border-espresso/8" : "border-b border-transparent"
      }`}
    >
      {/* Backdrop on a child so the header isn't the containing block for the mobile menu. */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-ivory/90 backdrop-blur-md transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />
      {children}
    </header>
  );
}
