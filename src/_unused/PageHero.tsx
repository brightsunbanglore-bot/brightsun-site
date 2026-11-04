import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  intro?: string;
};

export function PageHero({ eyebrow, title, intro }: PageHeroProps) {
  return (
    <section className="border-b border-ink/10">
      <Container className="pb-20 pt-40 md:pb-28 md:pt-52">
        <p className="eyebrow">{eyebrow}</p>
        <MaskedLines
          as="h1"
          start="top 95%"
          className="mt-6 font-display text-[clamp(3.2rem,8vw,8rem)] leading-[0.92] tracking-[-0.02em] text-ink"
        >
          {title}
        </MaskedLines>
        <p className="mt-8 max-w-xl text-lg text-ink/65">{intro ?? `Placeholder hero for the ${title} page.`}</p>
      </Container>
    </section>
  );
}
