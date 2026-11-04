"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/sections/ContactForm";
import { SunnyCompanion } from "@/components/mascot/SunnyCompanion";
import { siteConfig } from "@/data/site";
import { contactPage } from "@/data/contactPage";

const CSS = `
.ct-grain{background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>");mix-blend-mode:overlay;opacity:.09;animation:ct-grain 1.2s steps(6) infinite}
@keyframes ct-grain{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,3%)}100%{transform:translate(0,0)}}
@keyframes ct-shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
.ct-shimmer{background:linear-gradient(100deg,#FF8A1D 0%,#FFC233 30%,#FFF2C2 50%,#FFC233 70%,#FF8A1D 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ct-shimmer 5s linear infinite}
@keyframes ct-ping{0%{transform:scale(.6);opacity:.6}100%{transform:scale(2.4);opacity:0}}
.ct-glass{background:linear-gradient(155deg,rgba(255,255,255,.07),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,248,234,.12)}
@media (prefers-reduced-motion: reduce){.ct-grain,.ct-shimmer{animation:none!important}}
`;

const chars = (text: string, attr: string) =>
  text.split(" ").map((w, wi, arr) => (
    <span key={wi} className={`inline-block whitespace-nowrap ${wi < arr.length - 1 ? "mr-[0.26em]" : ""}`}>
      {w.split("").map((c, ci) => (
        <span key={ci} {...{ [attr]: "" }} className="inline-block">{c}</span>
      ))}
    </span>
  ));

const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.contact.addressLines.join(", "))}`;

function Faq({ q, a, open, onToggle, id }: { q: string; a: string; open: boolean; onToggle: () => void; id: string }) {
  return (
    <div data-ct-rv className="ct-glass overflow-hidden rounded-2xl">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-hero text-lg font-bold text-ivory md:text-xl">
          {q}
          <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun text-espresso transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
        </button>
      </h3>
      <div id={id} role="region" className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-base leading-relaxed text-ivory/70">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function ContactExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(0);
  const toForm = () => document.querySelector("[data-ct-form]")?.scrollIntoView({ behavior: "smooth" });

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("[data-ct-hc]", { opacity: 0, y: 70, rotateX: -70, filter: "blur(12px)" }, { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: 0.022, delay: 0.3 });
        gsap.fromTo("[data-ct-fade]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.22, delay: 1.0 });
        ScrollTrigger.batch("[data-ct-rv]", {
          start: "top 88%",
          once: true,
          onEnter: (b) => gsap.fromTo(b, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }),
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const c = siteConfig.contact;
  return (
    <div ref={root} className="bg-[#0e0908] text-ivory">
      <style>{CSS}</style>

      {/* ---------------- HERO ---------------- */}
      <section data-sun-scene="hero" aria-labelledby="ct-title" className="relative flex min-h-[88svh] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_120%,#5a2c12_0%,#1a110e_50%,#0e0908_100%)]">
        <span aria-hidden className="pointer-events-none absolute bottom-[-35%] left-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,138,29,.5),transparent_62%)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 text-center" style={{ perspective: "900px" }}>
          <p data-ct-fade className="text-xs font-extrabold uppercase tracking-[0.34em] text-sun">{contactPage.hero.eyebrow}</p>
          <h1 id="ct-title" className="mt-6 font-hero text-[clamp(2.6rem,8vw,7.4rem)] font-extrabold leading-[0.96] tracking-[-0.05em]">
            {chars(contactPage.hero.title, "data-ct-hc")}
          </h1>
          <p data-ct-fade className="mx-auto mt-8 max-w-2xl text-base text-ivory/70 md:text-xl">{contactPage.hero.tagline}</p>
          <div data-ct-fade className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={toForm} className="inline-flex items-center gap-2 rounded-full bg-sun px-8 py-4 text-sm font-bold text-espresso shadow-[0_18px_40px_-16px_rgba(255,194,51,0.7)] transition hover:-translate-y-0.5">
              Send a message <span aria-hidden>↓</span>
            </button>
            <a href={c.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-sm font-bold text-ivory/90 transition hover:border-sun hover:text-sun">
              Chat on WhatsApp
            </a>
          </div>
        </div>
        <div aria-hidden className="ct-grain pointer-events-none absolute -inset-[10%]" />
      </section>

      {/* ---------------- FORM + WAYS TO REACH US ---------------- */}
      <section data-ct-form aria-labelledby="ct-form-title" className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#3a2012_0%,#0e0908_62%)] py-24 md:py-32">
        <Container className="relative z-10">
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p data-ct-rv className="text-xs font-extrabold uppercase tracking-[0.34em] text-sun">{contactPage.form.eyebrow}</p>
              <h2 id="ct-form-title" data-ct-rv className="mt-5 font-hero text-[clamp(2.2rem,5vw,4.2rem)] font-extrabold leading-[1] tracking-[-0.045em]">
                <span className="ct-shimmer">{contactPage.form.title}</span>
              </h2>
              <p data-ct-rv className="mt-6 max-w-md text-base text-ivory/70 md:text-lg">{contactPage.form.body}</p>

              <ul className="mt-10 space-y-4">
                <li data-ct-rv>
                  <a href={c.whatsappHref} target="_blank" rel="noopener noreferrer" className="ct-glass group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5">
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-sun text-espresso">
                      <span aria-hidden className="absolute inset-0 rounded-full bg-sun" style={{ animation: "ct-ping 2.2s ease-out infinite" }} />
                      <svg viewBox="0 0 24 24" className="relative h-6 w-6 fill-current" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z" /></svg>
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-[0.18em] text-sun">WhatsApp</span>
                      <span className="block font-hero text-lg font-bold">{c.phoneDisplay}</span>
                    </span>
                  </a>
                </li>
                <li data-ct-rv>
                  <a href={c.phoneHref} className="ct-glass group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sun text-espresso">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.300.2 2.500.6 3.600.1.300 0 .700-.2 1z" /></svg>
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-[0.18em] text-sun">Call us</span>
                      <span className="block font-hero text-lg font-bold">{c.phoneDisplay}</span>
                    </span>
                  </a>
                </li>
                <li data-ct-rv>
                  <a href={mapHref} target="_blank" rel="noopener noreferrer" className="ct-glass group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun text-espresso">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden><path d="M12 2a7 7 0 0 0-7 7c0 5.200 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z" /></svg>
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-[0.18em] text-sun">Visit us</span>
                      <span className="block text-sm leading-snug text-ivory/85">{c.addressLines.join(", ")}</span>
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            <div data-ct-rv>
              <ContactForm />
            </div>
          </div>
        </Container>
        <div aria-hidden className="ct-grain pointer-events-none absolute -inset-[10%]" />
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section aria-labelledby="ct-faq" className="relative overflow-hidden bg-[#0e0908] py-24 md:py-32">
        <Container className="relative z-10">
          <div className="mx-auto max-w-3xl">
            <p data-ct-rv className="text-center text-xs font-extrabold uppercase tracking-[0.34em] text-sun">{contactPage.faq.eyebrow}</p>
            <h2 id="ct-faq" data-ct-rv className="mt-5 text-center font-hero text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[1] tracking-[-0.045em]">{contactPage.faq.title}</h2>
            <div className="mt-12 space-y-3">
              {contactPage.faq.items.map((it, i) => (
                <Faq key={it.q} id={`ct-faq-${i}`} q={it.q} a={it.a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <div data-sun-slot aria-hidden className="pointer-events-none invisible fixed left-0 top-0 h-[572px] w-[520px]" />
      <SunnyCompanion silent alwaysMini />
    </div>
  );
}
