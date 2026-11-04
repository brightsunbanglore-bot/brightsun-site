import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
  external?: boolean;
  /** Show the round arrow badge (primary) or trailing arrow (secondary). */
  arrow?: boolean;
};

/**
 * Brand buttons. Primary: golden pill with an espresso arrow badge.
 * Secondary: white pill with a trailing arrow.
 */
export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  external,
  arrow = true,
}: ButtonProps) {
  const sizing =
    size === "sm" ? "h-12 pl-6 pr-1.5 text-[0.95rem]" : "h-14 pl-7 pr-2 text-base md:h-16 md:pl-8 md:text-[1.05rem]";
  const base = `group/btn inline-flex items-center gap-4 rounded-full font-semibold transition-[transform,box-shadow,background-color] duration-300 ease-out active:scale-[0.97] ${sizing}`;
  const look =
    variant === "primary"
      ? "bg-sun text-espresso shadow-[0_10px_24px_-10px_rgba(255,138,29,0.7)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(255,138,29,0.8)]"
      : "bg-white pr-6 text-espresso shadow-[0_8px_24px_-14px_rgba(35,27,24,0.35)] hover:-translate-y-0.5 md:pr-7";

  const inner = (
    <>
      <span>{children}</span>
      {arrow &&
        (variant === "primary" ? (
          <span
            aria-hidden
            className={`flex items-center justify-center rounded-full bg-espresso text-ivory transition-transform duration-500 ease-[cubic-bezier(.19,1,.22,1)] group-hover/btn:translate-x-0.5 ${
              size === "sm" ? "h-9 w-9" : "h-10 w-10 md:h-12 md:w-12"
            }`}
          >
            <ArrowIcon />
          </span>
        ) : (
          <span aria-hidden className="transition-transform duration-500 group-hover/btn:translate-x-1">
            <ArrowIcon />
          </span>
        ))}
    </>
  );

  const classes = `${base} ${look} ${className}`;
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
