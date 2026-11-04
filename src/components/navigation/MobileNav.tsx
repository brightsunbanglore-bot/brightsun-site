"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/data/site";
import { siteConfig } from "@/data/site";
import { useIsActive } from "@/hooks/useIsActive";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const isActive = useIsActive();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="relative z-10 rounded-full border border-ink/15 bg-paper/70 px-4 py-2 text-sm backdrop-blur"
      >
        {open ? "Close" : "Menu"}
      </button>
      <div
        id="mobile-nav"
        data-lenis-prevent
        className={`fixed inset-0 flex flex-col justify-between bg-paper px-5 pb-10 pt-24 transition-[opacity,visibility] duration-500 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {items.map((item, i) => (
              <li key={item.href} className="border-b border-ink/10">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="flex items-baseline justify-between py-4 font-display text-[2.6rem] leading-none text-ink aria-[current=page]:text-maroon"
                >
                  {item.label}
                  <span className="font-sans text-xs text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a href={siteConfig.contact.phoneHref} className="text-sm text-ink/70">
          {siteConfig.contact.phoneDisplay}
        </a>
      </div>
    </div>
  );
}
