import Link from "next/link";
import { siteConfig } from "@/data/site";
import { services } from "@/data/home";
import { Container } from "./Container";

export function SiteFooter() {
  const { contact } = siteConfig;
  return (
    <footer className="bg-ink text-paper">
      <Container className="pt-20 md:pt-28">
        <div className="grid gap-14 border-b border-paper/12 pb-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="font-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[0.95]">
              Helping brands shine <em className="text-sun">brighter online.</em>
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-3 border-b border-paper/30 pb-1 text-sm transition-colors hover:border-paper"
            >
              Start a project
              <span aria-hidden>→</span>
            </Link>
          </div>

          <nav aria-label="Footer" className="md:col-span-2 md:col-start-7">
            <p className="text-xs uppercase tracking-[0.2em] text-paper/45">Navigate</p>
            <ul className="mt-5 space-y-3 text-sm">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-paper/80 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-paper/45">Services</p>
            <ul className="mt-5 space-y-3 text-sm text-paper/80">
              {services.map((s) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-paper/45">Contact</p>
            <address className="mt-5 space-y-3 text-sm not-italic text-paper/80">
              <p>
                {contact.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p>
                <a href={contact.phoneHref} className="transition-colors hover:text-white">
                  {contact.phoneDisplay}
                </a>
              </p>
              <p>
                <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  WhatsApp
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-8 text-xs text-paper/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>Electronic City Phase II, Bengaluru</p>
        </div>
      </Container>
    </footer>
  );
}
