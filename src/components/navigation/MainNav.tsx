"use client";

import Link from "next/link";
import type { NavItem } from "@/data/site";
import { useIsActive } from "@/hooks/useIsActive";

export function MainNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1 lg:gap-3">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative inline-flex flex-col items-center px-3 py-2 text-[0.95rem] font-medium transition-colors duration-300 ${
                  active ? "text-espresso" : "text-espresso/70 hover:text-espresso"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute -bottom-1 h-1 w-4 rounded-full bg-flame transition-transform duration-500 ease-[cubic-bezier(.19,1,.22,1)] ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
