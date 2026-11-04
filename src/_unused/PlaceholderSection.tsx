import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/animations/Reveal";

type PlaceholderSectionProps = {
  index: number;
  title: string;
};

/** Neutral block marking where a designed section will go. */
export function PlaceholderSection({ index, title }: PlaceholderSectionProps) {
  return (
    <section className="border-b border-ink/10">
      <Container className="py-20">
        <Reveal>
          <div className="flex min-h-56 flex-col justify-between rounded-2xl border border-dashed border-ink/20 bg-white/60 p-8">
            <span className="font-mono text-xs text-ink/50">Section {String(index).padStart(2, "0")}</span>
            <h2 className="font-display text-3xl text-ink md:text-4xl">{title}</h2>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
