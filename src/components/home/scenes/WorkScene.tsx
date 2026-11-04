"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cueSunny } from "@/components/mascot/mascotState";
import { Container } from "@/components/layout/Container";
import { MaskedLines } from "@/components/animations/MaskedLines";
import { Button } from "@/components/ui/Button";
import { caseStudies, caseMetrics, howWeGrow, type CaseStudy, type Gsc, type Proof } from "@/data/caseStudies";
import { SitePreview } from "./SitePreview";
import gscFile from "@/data/gsc.generated.json";
import { ClientLogo } from "./ClientLogo";

function LogoTile({ study }: { study: CaseStudy }) {
  return (
    <li className="flex h-[88px] w-[190px] shrink-0 items-center justify-center rounded-2xl bg-white px-6 shadow-[0_10px_30px_-22px_rgba(35,27,24,0.55)]">
      <ClientLogo study={study} className="max-h-12 max-w-[140px]" />
    </li>
  );
}

/** Two rows of original client logos drifting in opposite directions. */
function LogoWall() {
  const half = Math.ceil(caseStudies.length / 2);
  const rows = [caseStudies.slice(0, half), caseStudies.slice(half)];
  return (
    <div data-wall aria-label="Brands we work with" role="group" className="space-y-4 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      {rows.map((row, r) => (
        <div key={r} data-wall-row={r === 0 ? "left" : "right"} className="flex w-max gap-4 motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:justify-center">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className={`flex shrink-0 gap-4 ${copy === 1 ? "motion-reduce:hidden" : ""}`}>
              {[...row, ...row].map((s, i) => (
                <LogoTile key={`${s.slug}-${i}`} study={s} />
              ))}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}

function Track({ kind, steps, metric }: { kind: "organic" | "ai"; steps: { t: string; d: string }[]; metric?: { value: number; suffix: string; label: string } }) {
  return (
    <div data-track={kind} className="min-w-0 rounded-2xl bg-cream p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-hero text-[0.95rem] font-extrabold text-espresso">{kind === "organic" ? "Organic traffic" : "AI visibility"}</h4>
        {metric && (
          <span className="font-hero text-base font-extrabold leading-none text-flame">
            <span data-count={metric.value}>{metric.value}</span>
            {metric.suffix}
          </span>
        )}
      </div>
      <ol className="relative mt-2.5 space-y-2 pl-7">
        <span aria-hidden className="absolute bottom-2 left-[10px] top-2 w-0.5 rounded bg-espresso/10" />
        <span data-line aria-hidden className="absolute bottom-2 left-[10px] top-2 w-0.5 origin-top rounded bg-flame" />
        {steps.map((st, n) => (
          <li key={st.t} data-step className="relative">
            <span data-node aria-hidden className="absolute -left-7 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[0.65rem] font-bold text-espresso ring-2 ring-espresso/15">
              {n + 1}
            </span>
            <p className="text-[0.78rem] font-bold leading-tight text-espresso">{st.t}</p>
            <p className="text-[0.68rem] leading-snug text-espresso/60">{st.d}</p>
          </li>
        ))}
      </ol>
      {kind === "ai" && (
        <p data-ai-answer className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[0.68rem] text-espresso/70 ring-1 ring-espresso/10">
          <span className="text-flame">✦</span> AI answer cites <span data-ai-cite className="rounded bg-sun px-1.5 py-0.5 font-bold text-espresso">your brand</span>
        </p>
      )}
    </div>
  );
}

/** 7450 → "7.45k", 2100000 → "2.1m" (3 significant digits). */
function compact(n: number) {
  const [v, u] = n >= 1e6 ? [n / 1e6, "m"] : n >= 1e3 ? [n / 1e3, "k"] : [n, ""];
  return `${Number(v.toPrecision(3))}${u}`;
}

const nice = (v: number) => {
  const p = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
};
const dm = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

type LiveGsc = { from: string; to: string; clicks: number[]; impressions: number[]; totals: { clicks: number; impressions: number; ctr: number; position: number } };
function fromLive(l: LiveGsc): Gsc {
  return {
    clicks: l.totals.clicks,
    impressions: l.totals.impressions,
    ctr: l.totals.ctr,
    position: l.totals.position,
    range: `${dm(l.from)} – ${dm(l.to)} · last 3 months`,
    series: { clicks: l.clicks, impressions: l.impressions, clicksMax: nice(Math.max(...l.clicks)), impressionsMax: nice(Math.max(...l.impressions)), from: dm(l.from), to: dm(l.to) },
  };
}

/** Brown counter panel: Search Console figures (when available) or verified public figures from the client's site. */
function SearchPerformance({ g, proof, slug }: { g?: Gsc; proof?: Proof[]; slug: string }) {
  type Tile = { k: string; label: string; v: number; fmt: string; suffix?: string };
  const tiles: Tile[] = g
    ? ([
        g.clicks != null && { k: "clicks", label: "Total clicks", v: g.clicks, fmt: "compact" },
        { k: "imp", label: "Total impressions", v: g.impressions, fmt: "compact" },
        g.ctr != null && { k: "ctr", label: "Average CTR", v: g.ctr, fmt: "dec", suffix: "%" },
        g.position != null && { k: "pos", label: "Average position", v: g.position, fmt: "dec" },
      ].filter(Boolean) as Tile[])
    : (proof ?? []).map((p, i) => ({ k: String(i), label: p.label, v: p.value, fmt: p.dec ? "dec" : "int", suffix: p.suffix }));
  if (!tiles.length) {
    if (process.env.NODE_ENV === "production") return null;
    return <div className="rounded-xl border border-dashed border-flame/50 px-3 py-2 text-xs text-espresso/60">Dev only: add figures for “{slug}” in caseMetrics.</div>;
  }
  const show = (t: Tile) => (t.fmt === "compact" ? compact(t.v) : t.fmt === "int" ? Math.round(t.v).toLocaleString("en-IN") : t.v.toFixed(1));
  const cols = tiles.length >= 4 ? "grid-cols-4" : tiles.length === 3 ? "grid-cols-3" : tiles.length === 2 ? "grid-cols-2" : "grid-cols-1";
  return (
    <div data-perf className="overflow-hidden rounded-2xl bg-espresso text-ivory">
      <div className={`grid divide-x divide-ivory/10 ${cols}`}>
        {tiles.map((t) => (
          <div key={t.k} className="px-4 py-3.5">
            <p className="text-[0.68rem] font-medium text-ivory/65">{t.label}</p>
            <p className="mt-1.5 font-hero text-[2rem] font-extrabold leading-none tabular-nums text-sun">
              <span data-count={t.v} data-fmt={t.fmt}>{show(t)}</span>
              {t.suffix}
            </p>
          </div>
        ))}
      </div>
      <p className="border-t border-ivory/10 px-4 py-2 text-[0.64rem] text-ivory/50">
        {g ? `Google Search Console${g.range !== "Google Search Console" ? ` · ${g.range}` : ""}` : "From the client's website"}
      </p>
    </div>
  );
}

function StudyDetail({ study, index, total }: { study: CaseStudy; index: number; total: number }) {
  const how = howWeGrow(study);
  const m = caseMetrics[study.slug] ?? {};
  const ref = useRef<HTMLElement>(null);
  const [live, setLive] = useState<Gsc | null>(null);
  // Live Search Console data (last 3 months to today, refreshed daily by /api/gsc). Falls back to saved data.
  useEffect(() => {
    let off = false;
    fetch(`/api/gsc?slug=${study.slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: LiveGsc) => {
        if (off) return;
        setLive(fromLive(d));
        requestAnimationFrame(() => ref.current && playCard(ref.current));
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [study.slug]);
  return (
    <article ref={ref} data-detail className="relative grid gap-5 overflow-hidden rounded-[26px] bg-white p-4 shadow-[0_34px_70px_-34px_rgba(255,138,29,0.55)] md:p-5 lg:grid-cols-[0.9fr_1.1fr]">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sun/25" />
      <span data-sun-spot="work" aria-hidden className="pointer-events-none absolute left-[46%] top-[-52px] hidden h-px w-px lg:block" />
      <div className="relative flex min-w-0 flex-col">
        <header className="flex items-center gap-3">
          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl bg-ivory ring-1 ring-espresso/10">
            <ClientLogo study={study} className="max-h-9 max-w-[76px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-flame">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {study.sector}
            </p>
            <h3 className="truncate font-hero text-[1.35rem] font-extrabold leading-tight tracking-tight text-espresso">{study.name}</h3>
            {study.url && study.domain && (
              <a href={study.url} target="_blank" rel="noopener noreferrer" className="text-xs text-espresso/55 underline-offset-4 hover:text-flame hover:underline">
                {study.domain} ↗
              </a>
            )}
          </div>
        </header>
        <div className="mx-auto mt-3 w-full max-w-[500px]">
          <SitePreview study={study} />
        </div>
        <p className="mt-2.5 text-[0.82rem] leading-snug text-espresso/70">{study.about}</p>
        {study.result ? (
          <div className="mt-3 flex items-center gap-4 rounded-xl bg-espresso px-4 py-3 text-ivory">
            <p className="font-hero text-3xl font-extrabold leading-none text-sun">{study.result.value}</p>
            <p className="text-xs leading-snug text-ivory/75">
              {study.result.label}
              {study.result.source && (
                <>
                  {" · "}
                  <a href={study.result.source.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-sun">
                    {study.result.source.label}
                  </a>
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-sun/25 px-3.5 py-1.5 text-sm font-semibold text-espresso">
            <span aria-hidden className="h-2 w-2 rounded-full bg-flame" />
            {study.fact}
          </p>
        )}
      </div>

      <div className="relative flex min-w-0 flex-col gap-3">
        <div data-serp aria-hidden className="rounded-2xl bg-cream p-2.5">
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-[0_8px_20px_-16px_rgba(35,27,24,0.6)]">
            <span className="text-espresso/40">⌕</span>
            <span data-serp-q className="min-h-[1.25em] flex-1 truncate text-sm text-espresso/80">{study.query}</span>
            <span className="h-4 w-px bg-flame" />
          </div>
          <div data-serp-hit className="mt-2 flex items-center gap-3 rounded-xl bg-white p-2 ring-2 ring-sun">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ivory">
              <ClientLogo study={study} mini className="max-h-6 max-w-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-espresso">{study.name}</span>
              <span className="block truncate text-xs text-espresso/50">{study.domain ?? study.name}</span>
            </span>
            <span data-serp-badge className="shrink-0 whitespace-nowrap rounded-full bg-sun px-2.5 py-1 text-[0.68rem] font-bold text-espresso">☀ Found</span>
          </div>
          <span data-serp-query hidden>{study.query}</span>
        </div>
        <SearchPerformance proof={m.proof} g={live ?? ((gscFile as Record<string, LiveGsc>)[study.slug] ? fromLive((gscFile as Record<string, LiveGsc>)[study.slug]) : m.gsc)} slug={study.slug} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Track kind="organic" steps={how.organic} metric={m.organic} />
          <Track kind="ai" steps={how.ai} metric={m.ai} />
        </div>
        <ul className="flex flex-wrap gap-2" aria-label={`Visibility focus for ${study.name}`}>
          {study.levers.map((l) => (
            <li key={l} className="rounded-full border border-espresso/15 px-3 py-1 text-xs font-semibold text-espresso">
              {l}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** Plays a card: homepage scroll, Search Console counters + chart drawing, then both growth tracks step by step. */
function playCard(card: HTMLElement) {
  const site = card.querySelector<HTMLElement>("[data-site-img]");
  const scan = card.querySelector<HTMLElement>("[data-site-scan]");
  const tracks = Array.from(card.querySelectorAll<HTMLElement>("[data-track]"));
  const draws = Array.from(card.querySelectorAll<SVGPathElement>("[data-draw]"));
  const area = card.querySelector<SVGPathElement>("[data-area]");
  const dot = card.querySelector<SVGCircleElement>("[data-dot]");
  gsap.killTweensOf([site, scan, area, dot, ...draws]);
  tracks.forEach((t) => gsap.killTweensOf(t.querySelectorAll("*")));
  const q = card.querySelector<HTMLElement>("[data-serp-q]");
  const text = card.querySelector<HTMLElement>("[data-serp-query]")?.textContent ?? "";
  const hit = card.querySelector<HTMLElement>("[data-serp-hit]");
  const badge = card.querySelector<HTMLElement>("[data-serp-badge]");
  const typed = { n: 0 };
  gsap.killTweensOf([typed, hit, badge]);
  const tl = gsap.timeline();
  if (q && hit && badge) {
    q.textContent = "";
    gsap.set(hit, { autoAlpha: 0, y: 14 });
    gsap.set(badge, { scale: 0 });
    tl.to(typed, { n: text.length, duration: Math.max(0.6, text.length * 0.03), ease: "none", onUpdate: () => (q.textContent = text.slice(0, Math.round(typed.n))) }, 0.1)
      .to(hit, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }, "+=0.1")
      .to(badge, { scale: 1, duration: 0.45, ease: "back.out(2.4)" }, "-=0.2");
  }
  if (site) tl.fromTo(site, { yPercent: 0 }, { yPercent: -18, duration: 5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
  if (scan) tl.fromTo(scan, { yPercent: -100, opacity: 0.9 }, { yPercent: 300, opacity: 0, duration: 1.4, ease: "power2.inOut" }, 0);

  // Search Console panel: fast-running counters and a chart that draws left to right.
  card.querySelectorAll<HTMLElement>("[data-perf] [data-count]").forEach((c, i) => {
    const end = Number(c.dataset.count);
    const fmt = c.dataset.fmt;
    const o = { v: 0 };
    tl.to(
      o,
      {
        v: end,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: () => (c.textContent = fmt === "compact" ? compact(o.v) : fmt === "int" ? Math.round(o.v).toLocaleString("en-IN") : o.v.toFixed(1)),
      },
      0.15 + i * 0.12,
    );
  });
  if (draws.length) tl.fromTo(draws, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", stagger: 0.2 }, 0.2);
  if (area) tl.fromTo(area, { opacity: 0 }, { opacity: 0.07, duration: 1, ease: "power1.out" }, 1.6);
  if (dot) tl.fromTo(dot, { scale: 0, transformOrigin: "center" }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 2.2);

  tracks.forEach((t, k) => {
    const at = 0.8 + k * 0.5;
    const steps = t.querySelectorAll("[data-step]");
    const nodes = t.querySelectorAll("[data-node]");
    tl.fromTo(t.querySelector("[data-line]"), { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: "power2.inOut" }, at);
    tl.fromTo(steps, { autoAlpha: 0.25, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "power2.out", stagger: 0.5 }, at);
    tl.fromTo(nodes, { backgroundColor: "#ffffff" }, { backgroundColor: "#FFC233", duration: 0.3, stagger: 0.5 }, at);
    const cite = t.querySelector("[data-ai-cite]");
    if (cite) tl.fromTo(cite, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(3)" }, at + 1.6);
  });
}

/**
 * Scene 5 — our work. A drifting wall of original client logos, then a
 * tabbed case-study stage: every client tab is visible at once. On desktop the
 * section pins and scrolling steps through the clients (clicking a tab jumps
 * there); on smaller screens the tabs sit above a detail panel and tapping
 * switches. Each switch replays the animation: homepage preview, search
 * typing, traffic bars and the organic / AI-visibility steps. Without motion,
 * the panel simply shows its final state.
 */
export function WorkScene() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const st = useRef<ScrollTrigger | null>(null);
  const total = caseStudies.length;

  // Replay the panel animation whenever the active client changes.
  useGSAP(
    () => {
      const el = root.current?.querySelector<HTMLElement>("[data-detail]");
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" });
        playCard(el);
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [active] },
  );

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        section.querySelectorAll<HTMLElement>("[data-wall-row]").forEach((row) => {
          const left = row.dataset.wallRow === "left";
          const tween = gsap.fromTo(row, { xPercent: left ? 0 : -50 }, { xPercent: left ? -50 : 0, duration: 46, ease: "none", repeat: -1 });
          row.addEventListener("pointerenter", () => gsap.to(tween, { timeScale: 0.2, duration: 0.5 }));
          row.addEventListener("pointerleave", () => gsap.to(tween, { timeScale: 1, duration: 0.5 }));
        });
        gsap.from("[data-cs-tab]", { y: 24, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.04, scrollTrigger: { trigger: "[data-cs-tabs]", start: "top 88%", once: true } });
      });
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const pinEl = section.querySelector<HTMLElement>("[data-cs-pin]");
        if (!pinEl) return;
        let last = 0;
        let lastCue = 0;
        st.current = ScrollTrigger.create({
          trigger: pinEl,
          start: "top top",
          end: () => `+=${(total - 1) * 340}`,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const i = Math.round(self.progress * (total - 1));
            if (i === last) return;
            last = i;
            setActive(i);
            const now = performance.now();
            if (now - lastCue > 1400) {
              lastCue = now;
              cueSunny("nod");
            }
          },
        });
        return () => {
          st.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const choose = (i: number) => {
    setActive(i);
    const t = st.current;
    if (t) window.scrollTo({ top: t.start + (t.end - t.start) * (i / (total - 1)) + 1 });
  };

  return (
    <section ref={root} id="work" data-sun-scene="work" data-sun-cue="pride" data-sun-cue-back="nod" aria-labelledby="work-title" className="relative bg-ivory">
      <Container className="pb-10 pt-28 md:pt-40">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-espresso">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-flame" />
              Case studies
            </p>
            <MaskedLines as="h2" id="work-title" className="mt-5 font-hero text-[clamp(2.4rem,4.4vw,4.2rem)] font-extrabold leading-[1] tracking-[-0.04em] text-espresso">
              Brands we&apos;ve helped get <span className="text-flame">found</span>
            </MaskedLines>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso/70">
              From pharmacies and coaching to export manufacturing and a nutrition brand that was acquired: real businesses, real search demand.
            </p>
          </div>
          <div className="shrink-0">
            <Button href="/work" variant="secondary">
              See our work
            </Button>
          </div>
        </div>
      </Container>

      <LogoWall />

      <div data-cs-pin className="flex flex-col justify-center pb-16 pt-10 lg:h-svh lg:pb-6 lg:pt-[96px]">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
          <div data-cs-tabs className="flex items-center justify-between gap-4">
            <div role="tablist" aria-label="Client case studies" className="flex items-center gap-1.5">
              {caseStudies.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={s.name}
                  onClick={() => choose(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-flame" : "w-2 bg-espresso/20 hover:bg-espresso/40"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous case study" onClick={() => choose((active + total - 1) % total)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-espresso ring-1 ring-espresso/15 transition hover:bg-sun">
                ←
              </button>
              <button type="button" aria-label="Next case study" onClick={() => choose((active + 1) % total)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-espresso ring-1 ring-espresso/15 transition hover:bg-sun">
                →
              </button>
            </div>
          </div>
          <div role="tabpanel" className="mt-3">
            <StudyDetail key={caseStudies[active].slug} study={caseStudies[active]} index={active} total={total} />
          </div>
        </div>
      </div>
    </section>
  );
}
