import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";
import { Magnetic } from "@/components/animations/Magnetic";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";
import { contactCta } from "@/data/home";

/** Conversion block, reusable on any page. */
export function ContactCta() {
  const { contact } = siteConfig;
  return (
    <section aria-labelledby="cta-title" className="relative bg-paper">
      <Container className="py-28 md:py-44">
        <p className="eyebrow">
          <span className="text-maroon">03</span> — Contact
        </p>
        <MaskedLines
          as="h2"
          id="cta-title"
          className="mt-8 max-w-[14ch] font-display text-[clamp(3rem,9vw,9.5rem)] leading-[0.9] tracking-[-0.025em] text-ink"
        >
          Let&apos;s discuss your <em className="text-maroon">project.</em>
        </MaskedLines>

        <div className="mt-14 grid gap-12 border-t border-ink/12 pt-10 md:mt-20 md:grid-cols-12">
          <p className="max-w-md text-lg leading-relaxed text-ink/70 md:col-span-5">{contactCta.body}</p>
          <div className="flex flex-col gap-8 md:col-span-6 md:col-start-7 md:flex-row md:items-start md:justify-between">
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ink/45">Call or WhatsApp</dt>
                <dd className="mt-2 text-lg text-ink">
                  <a href={contact.phoneHref} className="link-underline">
                    {contact.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ink/45">Office</dt>
                <dd className="mt-2 text-ink/75">
                  {contact.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <div className="flex flex-col items-start gap-3">
              <Magnetic>
                <Button href="/contact">Start a project</Button>
              </Magnetic>
              <Button href={contact.whatsappHref} variant="secondary" external>
                Message on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
