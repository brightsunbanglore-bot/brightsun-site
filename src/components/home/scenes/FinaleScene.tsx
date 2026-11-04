"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";
import { ContactForm } from "@/components/sections/ContactForm";
import { siteConfig } from "@/data/site";
import { contactCta } from "@/data/home";

/**
 * Scene 7 — contact finale. A full-width golden panel opens from a small
 * rounded window to edge-to-edge as it scrolls in. Sunny grows a little,
 * gestures towards the call to action, then waves goodbye.
 */
export function FinaleScene() {
  const root = useRef<HTMLElement>(null);
  const { contact } = siteConfig;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-finale-gold]",
          { clipPath: "inset(12% 10% 12% 10% round 48px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "power2.out",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 15%", scrub: 0.7 },
          },
        );
        gsap.from("[data-finale-fade]", {
          y: 28,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 45%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-sun-scene="finale"
      data-sun-cue="finale"
      data-sun-cue-back="hello"
      data-sun-grow="1.3"
      aria-labelledby="finale-title"
      className="relative bg-ivory"
    >
      <div data-finale-gold className="bg-sun">
        <Container className="relative pb-16 pt-12 md:pb-20 md:pt-16">
          <p className="inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-espresso">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-espresso" />
            Contact
          </p>
          <MaskedLines
            as="h2"
            id="finale-title"
            className="mt-5 max-w-[16ch] font-hero text-[clamp(2.6rem,6.2vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-espresso"
          >
            {contactCta.title}
          </MaskedLines>

          <div className="mt-9 grid gap-10 border-t border-espresso/15 pt-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p data-finale-fade className="max-w-md text-lg leading-relaxed text-espresso/80">
                {contactCta.body}
              </p>
              <dl data-finale-fade className="mt-10 grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-espresso/55">Call or WhatsApp</dt>
                  <dd className="mt-2 text-lg font-semibold text-espresso">
                    <a href={contact.phoneHref} className="link-underline">
                      {contact.phoneDisplay}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-espresso/55">Office</dt>
                  <dd className="mt-2 text-espresso/80">
                    {contact.addressLines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="relative lg:col-span-6 lg:col-start-7">
              {/* Desktop: Sunny stands on the top edge of the form card. */}
              <span data-sun-spot="finale" aria-hidden className="absolute right-28 -top-24 hidden h-px w-px lg:block" />
              <div data-finale-fade>
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
