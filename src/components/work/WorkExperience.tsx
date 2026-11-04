"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/sections/ContactForm";
import { SunnyCompanion } from "@/components/mascot/SunnyCompanion";
import { cueSunny } from "@/components/mascot/mascotState";
import { ClientLogo } from "@/components/home/scenes/ClientLogo";
import { SitePreview } from "@/components/home/scenes/SitePreview";
import { caseStudies, type CaseStudy } from "@/data/caseStudies";
import { WORK_CUES, workHero, workStats, workStory } from "@/data/workPage";

const PAGE_CSS = `
@keyframes wk-drift{0%{transform:translate(0,0) scale(1)}100%{transform:translate(40px,-30px) scale(1.12)}}
@keyframes wk-shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes wk-pulse{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes wk-ping{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.2);opacity:0}}
.wk-blob{position:absolute;border-radius:50%;filter:blur(90px);animation:wk-drift 18s ease-in-out infinite alternate}
.wk-shimmer{background:linear-gradient(100deg,#FF8A1D 0%,#FFC233 30%,#FFF2C2 50%,#FFC233 70%,#FF8A1D 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:wk-shimmer 5s linear infinite}
.wk-outline{-webkit-text-stroke:2px rgba(255,248,234,.07);color:transparent}
.wk-orb{position:absolute;left:50%;top:50%;will-change:transform,opacity;transform-style:preserve-3d}
.wk-tile{display:flex;height:64px;width:140px;align-items:center;justify-content:center;border-radius:18px;background:#fff;box-shadow:0 18px 40px -24px rgba(35,27,24,.55),0 0 0 1px rgba(255,194,51,.25);cursor:pointer;transition:box-shadow .3s}
.wk-tile:hover{box-shadow:0 26px 50px -22px rgba(255,138,29,.7),0 0 0 2px #FFC233}
.wk-tilt{transform-style:preserve-3d;transform:perspective(1200px) rotateY(var(--ry,0deg)) rotateX(var(--rx,0deg));transition:transform .25s ease-out}
.wk-glass{background:linear-gradient(155deg,rgba(255,255,255,.07),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,248,234,.12)}
@media (prefers-reduced-motion: reduce){.wk-blob,.wk-shimmer{animation:none!important}}
`;

const fmt = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : String(n));

function ResultBlock({ s }: { s: CaseStudy }) {
  const st = workStory(s);
  const r = st.result;
  return (
    <div className="wk-glass rounded-2xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sun">Result</p>
      {r.kind === "gsc" && (
        <>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            {r.clicks ? (
              <div>
                <p className="font-hero text-3xl font-extrabold leading-none text-ivory">
                  <span data-wk-count={r.clicks} data-fmt="1">{fmt(r.clicks)}</span>
                </p>
                <p className="mt-1 text-[11px] text-ivory/55">clicks from Google</p>
              </div>
            ) : null}
            <div>
              <p className="font-hero text-3xl font-extrabold leading-none text-ivory">
                <span data-wk-count={r.impressions} data-fmt="1">{fmt(r.impressions)}</span>
              </p>
              <p className="mt-1 text-[11px] text-ivory/55">search impressions</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-ivory/40">Google Search Console · {r.range}</p>
        </>
      )}
      {r.kind === "proof" && (
        <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
          {r.items.map((p) => (
            <div key={p.label}>
              <p className="font-hero text-3xl font-extrabold leading-none text-ivory">
                <span data-wk-count={p.value} data-dec={p.dec ? 1 : 0}>{p.dec ? p.value.toFixed(1) : p.value.toLocaleString("en-IN")}</span>
                {p.suffix}
              </p>
              <p className="mt-1 text-[11px] text-ivory/55">{p.label}</p>
            </div>
          ))}
        </div>
      )}
      {r.kind === "none" && <p className="mt-2 text-sm text-ivory/60">Results are being compiled with the client.</p>}
      {s.result && (
        <p className="mt-2 text-[11px] text-ivory/60">
          <span className="font-bold text-sun">{s.result.value}</span> {s.result.label}
          {s.result.source && (
            <>
              {" "}
              ·{" "}
              <a href={s.result.source.href} target="_blank" rel="noreferrer" className="underline decoration-sun/50 underline-offset-2">
                {s.result.source.label}
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function Panel({ s, i }: { s: CaseStudy; i: number }) {
  const st = workStory(s);
  const tilt = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = tilt.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
    el.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 9}deg`);
  };
  const leave = () => {
    tilt.current?.style.setProperty("--ry", "0deg");
    tilt.current?.style.setProperty("--rx", "0deg");
  };
  return (
    <article data-wk-panel={i} id={`work-${s.slug}`} className="relative flex min-h-screen w-screen shrink-0 items-center overflow-hidden lg:h-screen lg:pb-16 lg:pt-[132px]">
      <span aria-hidden data-wk-num className="wk-outline pointer-events-none absolute left-[2vw] top-1/2 -translate-y-1/2 select-none font-hero text-[clamp(14rem,34vw,34rem)] font-extrabold leading-none tracking-[-0.05em]">
        {String(i + 1).padStart(2, "0")}
      </span>
      <Container data-wk-inner className="relative grid w-full items-center gap-8 lg:grid-cols-12">
        <div data-wk-copy className="lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-sun px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-espresso">{s.sector}</span>
            <span className="text-[11px] font-semibold text-ivory/50">{s.fact}</span>
          </div>
          <h3 className="mt-4 font-hero text-[clamp(2.4rem,5.2vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-ivory">{s.name}</h3>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ivory/65">{s.about}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="wk-glass rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sun">Challenge</p>
              <p className="mt-1.5 text-[13px] leading-snug text-ivory/75">{st.challenge}</p>
            </div>
            <div className="wk-glass rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sun">What we did</p>
              <p className="mt-1.5 text-[13px] leading-snug text-ivory/75">{st.did}</p>
            </div>
          </div>
          <div className="mt-3">
            <ResultBlock s={s} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {s.levers.map((l) => (
              <span key={l} className="rounded-full bg-ivory/10 px-3 py-1 text-[11px] font-semibold text-ivory/80">{l}</span>
            ))}
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" className="ml-1 text-[12px] font-bold text-sun underline decoration-sun/40 underline-offset-4">
                Visit {s.domain ?? s.name} ↗
              </a>
            )}
          </div>
        </div>
        <div data-wk-visual className="lg:col-span-7" onPointerMove={move} onPointerLeave={leave}>
          <div ref={tilt} className="wk-tilt">
            <div className="relative">
              <div aria-hidden className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle,rgba(255,194,51,.28),transparent_70%)] blur-2xl" />
              <div className="relative">
                <SitePreview study={s} />
              </div>
              <div className="absolute -right-3 -top-6 flex h-16 w-32 items-center justify-center rounded-2xl bg-white px-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]" style={{ transform: "translateZ(60px)" }}>
                <ClientLogo study={s} className="max-h-10 max-w-[100px]" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </article>
  );
}

export function WorkExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const stats = workStats();

  // ---- logo stage: two curved rows of logos gliding in opposite directions (own ticker, only while on screen)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const hero = el.querySelector<HTMLElement>("[data-wk-hero]");
    const orbs = Array.from(el.querySelectorAll<HTMLElement>("[data-wk-orb]"));
    if (!hero || !orbs.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = [orbs.filter((_, i) => i % 2 === 0), orbs.filter((_, i) => i % 2 === 1)];
    let t = 0, boost = 0, tb = 0, visible = true;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tb = ((e.clientX - r.left) / r.width - 0.5) * 2; // cursor on the right speeds rows up, left slows
    };
    hero.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(hero);
    const tick = (_: number, dms: number) => {
      if (!visible) return;
      const dt = Math.min(0.05, dms / 1000);
      boost += (tb - boost) * Math.min(1, dt * 2.5);
      if (!reduce) t += dt * (1 + boost * 0.6);
      const w = hero.clientWidth, h = hero.clientHeight;
      const small = w < 760;
      const sp = small ? 118 : 178; // spacing between logo centres
      rows.forEach((row, r) => {
        const total = row.length * sp;
        const half = total / 2;
        const dir = r === 0 ? -1 : 1;
        const base = h - (r === 0 ? (small ? 200 : 190) : (small ? 96 : 88));
        row.forEach((o, i) => {
          let x = i * sp + t * 34 * dir * (r === 0 ? 1 : 0.8);
          x = ((((x + half) % total) + total) % total) - half; // wrap to [-half, half)
          const u = x / half; // -1..1
          const au = Math.abs(u);
          const y = base + u * u * (small ? 26 : 46) - h * 0.5;
          const sc = 1.05 - 0.38 * au;
          const op = Math.max(0, 1 - Math.pow(au, 2.6) * 1.05);
          o.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) rotateY(${(-u * 28).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
          o.style.opacity = op.toFixed(3);
          o.style.zIndex = String(Math.round((1 - au) * 10));
          o.style.pointerEvents = op < 0.25 ? "none" : "auto";
        });
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      hero.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = caseStudies.length;

      // hero entrance
      if (!reduce) {
        gsap.fromTo("[data-wk-char]", { yPercent: 120, rotateX: -80, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, ease: "back.out(1.5)", stagger: 0.025, delay: 0.2 });
        gsap.fromTo("[data-wk-fade]", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.9 });
        gsap.fromTo("[data-wk-stage]", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, ease: "expo.out", delay: 0.5 });
      }

      // stat counters
      el.querySelectorAll<HTMLElement>("[data-wk-stat]").forEach((node) => {
        const target = Number(node.dataset.wkStat);
        const o = { v: 0 };
        ScrollTrigger.create({
          trigger: node,
          start: "top 90%",
          once: true,
          onEnter: () => gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: () => (node.textContent = String(Math.round(o.v)) + (node.dataset.wkSuffix || "")) }),
        });
      });

      const runCounters = (panel: Element | null) => {
        if (!panel) return;
        panel.querySelectorAll<HTMLElement>("[data-wk-count]").forEach((c) => {
          const target = Number(c.dataset.wkCount);
          const dec = c.dataset.dec === "1";
          const useFmt = c.dataset.fmt === "1";
          const o = { v: 0 };
          gsap.to(o, {
            v: target,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
              const v = o.v;
              c.textContent = useFmt ? fmt(Math.round(v)) : dec ? v.toFixed(1) : Math.round(v).toLocaleString("en-IN");
            },
          });
        });
      };

      const setActiveIdx = (i: number) => {
        if (i === activeRef.current) return;
        activeRef.current = i;
        setActive(i);
        cueSunny(WORK_CUES[i % WORK_CUES.length]);
        runCounters(el.querySelector(`[data-wk-panel="${i}"]`));
      };

      mm.add("(min-width: 1024px)", () => {
        // shrink each panel's content to fit short screens so nothing collides with the label above
        const fit = () => {
          const avail = window.innerHeight - 132 - 64;
          el.querySelectorAll<HTMLElement>("[data-wk-inner]").forEach((inner) => {
            inner.style.transform = "none";
            const hgt = inner.offsetHeight;
            const k = hgt > avail ? Math.max(0.5, avail / hgt) : 1;
            inner.style.transformOrigin = "50% 50%";
            inner.style.transform = k < 1 ? `scale(${k})` : "none";
          });
        };
        fit();
        const late = () => { fit(); ScrollTrigger.refresh(); };
        const t1 = window.setTimeout(late, 500);
        const t2 = window.setTimeout(late, 1800);
        window.addEventListener("load", late);
        document.fonts?.ready.then(late).catch(() => {});
        ScrollTrigger.addEventListener("refreshInit", fit);
        const track = el.querySelector<HTMLElement>("[data-wk-track]")!;
        const gallery = el.querySelector<HTMLElement>("[data-wk-gallery]")!;
        const dist = () => (n - 1) * window.innerWidth;
        const move = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: gallery,
            start: "top top",
            end: () => `+=${dist() * 0.85}`,
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            snap: { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.6 }, ease: "power2.inOut", delay: 0.05 },
            onUpdate: (self) => setActiveIdx(Math.round(self.progress * (n - 1))),
          },
        });
        el.querySelectorAll<HTMLElement>("[data-wk-panel]").forEach((p) => {
          const st = { trigger: p, containerAnimation: move, start: "left right", end: "right left", scrub: true } as const;
          const num = p.querySelector("[data-wk-num]");
          const vis = p.querySelector("[data-wk-visual]");
          const copy = p.querySelector("[data-wk-copy]");
          if (num) gsap.fromTo(num, { xPercent: 22 }, { xPercent: -22, ease: "none", scrollTrigger: st });
          if (vis) gsap.fromTo(vis, { xPercent: 10, rotate: 1.5 }, { xPercent: -10, rotate: -1.5, ease: "none", scrollTrigger: st });
          if (copy) gsap.fromTo(copy, { xPercent: 4, opacity: 0.2 }, { xPercent: -4, opacity: 1, ease: "none", scrollTrigger: { ...st, end: "center center" } });
        });
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", fit);
          window.clearTimeout(t1); window.clearTimeout(t2);
          window.removeEventListener("load", late);
          el.querySelectorAll<HTMLElement>("[data-wk-inner]").forEach((inner) => { inner.style.transform = ""; });
          gsap.set(track, { clearProps: "transform" });
        };
      });

      // small screens: panels stack, no pin
      mm.add("(max-width: 1023px)", () => {
        el.querySelectorAll<HTMLElement>("[data-wk-panel]").forEach((p, i) => {
          ScrollTrigger.create({ trigger: p, start: "top 60%", end: "bottom 40%", onToggle: (self) => self.isActive && setActiveIdx(i) });
          gsap.from(p.querySelector("[data-wk-copy]"), { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 80%" } });
        });
      });

      // finale
      gsap.from("[data-wk-final]", { y: 50, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: "[data-wk-finale]", start: "top 70%" } });

      return () => mm.revert();
    },
    { scope: root },
  );

  const jumpTo = (i: number) => {
    const el = root.current;
    if (!el) return;
    const st = ScrollTrigger.getAll().find((s) => s.pin && (s.trigger as Element)?.hasAttribute?.("data-wk-gallery"));
    if (st) {
      const y = st.start + (i / (caseStudies.length - 1)) * (st.end - st.start);
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      el.querySelector(`[data-wk-panel="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const split = (text: string, cls = "") =>
    text.split(" ").map((w, wi, arr) => (
      <span key={wi} className="inline-block whitespace-nowrap" style={{ perspective: "700px" }}>
        {w.split("").map((c, ci) => (
          <span key={ci} data-wk-char className={`inline-block ${cls}`} style={{ transformOrigin: "50% 100%" }}>
            {c}
          </span>
        ))}
        {wi < arr.length - 1 ? " " : ""}
      </span>
    ));

  return (
    <div ref={root} className="relative overflow-x-clip bg-ivory">
      <style>{PAGE_CSS}</style>

      {/* ---------------- HERO: logo constellation ---------------- */}
      <section data-wk-hero data-sun-scene="hero" aria-labelledby="wk-title" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#FFF1D2,#FFFDF7_70%)]">
        <span aria-hidden className="wk-blob -left-24 top-10 h-[420px] w-[420px] bg-sun/40" />
        <span aria-hidden className="wk-blob -right-20 bottom-0 h-[460px] w-[460px] bg-flame/25" style={{ animationDelay: "-6s" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(35,27,24,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(35,27,24,.045)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(circle_at_50%_50%,#000,transparent_75%)]" />

        {/* orbiting logos */}
        <div data-wk-stage aria-label="Brands we work with" role="group" className="absolute inset-0" style={{ perspective: "1400px" }}>
          {caseStudies.map((s, i) => (
            <button key={s.slug} type="button" data-wk-orb onClick={() => jumpTo(i)} aria-label={`${s.name} case study`} className="wk-orb wk-tile">
              <ClientLogo study={s} eager className="max-h-9 max-w-[104px]" />
            </button>
          ))}
        </div>

        <div className="pointer-events-none relative z-30 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-[270px] pt-32 text-center md:pt-36">
          <span data-wk-fade className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/70 shadow-[0_10px_26px_-16px_rgba(35,27,24,0.6)]">
            <span className="h-2 w-2 rounded-full bg-flame" /> {workHero.eyebrow}
          </span>
          <h1 id="wk-title" className="mt-6 font-hero text-[clamp(2.6rem,6.4vw,6.2rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-espresso">
            <span className="block">{split(workHero.titleTop)}</span>
            <span className="block">{split(workHero.titleAccent, "wk-shimmer")}</span>
          </h1>
          <p data-wk-fade className="mt-5 max-w-xl text-base text-espresso/65 md:text-lg">{workHero.intro}</p>
          <button type="button" data-wk-fade onClick={() => jumpTo(0)} className="pointer-events-auto mt-7 inline-flex items-center gap-2 rounded-full bg-espresso px-6 py-3 text-sm font-semibold text-ivory shadow-[0_18px_36px_-16px_rgba(35,27,24,0.8)] transition hover:-translate-y-0.5">
            See the work <span aria-hidden>↓</span>
          </button>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section aria-label="At a glance" className="relative border-y border-espresso/10 bg-white">
        <Container className="grid grid-cols-3 divide-x divide-espresso/10 py-8 text-center">
          {[
            { v: 100, l: "Brands served", x: "+" },
            { v: 5, l: "Years of growth", x: "" },
            { v: stats.clients, l: "Featured below", x: "" },
          ].map((x) => (
            <div key={x.l} className="px-2">
              <p className="font-hero text-4xl font-extrabold text-espresso md:text-6xl">
                <span data-wk-stat={x.v} data-wk-suffix={x.x}>0</span>
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-espresso/50 md:text-xs">{x.l}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* ---------------- GALLERY ---------------- */}
      <section data-wk-gallery aria-label="Case studies" className="relative bg-espresso text-ivory lg:h-screen lg:overflow-hidden">
        <span aria-hidden className="wk-blob left-[10%] top-[-10%] h-[520px] w-[520px] bg-flame/20" />
        <span aria-hidden className="wk-blob bottom-[-20%] right-[5%] h-[560px] w-[560px] bg-sun/15" style={{ animationDelay: "-8s" }} />

        {/* label + counter */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden px-10 pt-24 lg:block">
          <div className="flex items-end justify-between">
            <p className="font-hero text-xs font-extrabold uppercase tracking-[0.22em] text-sun">Case studies</p>
            <p className="font-hero text-xl font-extrabold text-ivory">
              {String(active + 1).padStart(2, "0")} <span className="text-ivory/35">/ {String(caseStudies.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>

        <div data-wk-track className="flex flex-col lg:w-max lg:flex-row">
          {caseStudies.map((s, i) => (
            <Panel key={s.slug} s={s} i={i} />
          ))}
        </div>

        {/* rail */}
        <nav aria-label="Jump to a case study" className="absolute inset-x-0 bottom-5 z-20 hidden justify-center gap-2 lg:flex">
          {caseStudies.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={s.name}
              aria-current={i === active}
              className={`group relative h-2.5 rounded-full transition-all duration-300 ${i === active ? "w-10 bg-sun" : "w-2.5 bg-ivory/25 hover:bg-ivory/60"}`}
            >
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ivory px-2.5 py-1 text-[10px] font-semibold text-espresso opacity-0 transition group-hover:opacity-100">{s.name}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* ---------------- FINALE ---------------- */}
      <section data-wk-finale aria-labelledby="wk-cta" className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#FFE29A,#FFC233_45%,#FF8A1D)] py-24 md:py-32">
        <Container className="relative grid items-center gap-12 lg:grid-cols-12">
          <div data-wk-final className="lg:col-span-6">
            <h2 id="wk-cta" className="font-hero text-[clamp(3rem,7vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-espresso">
              Your brand
              <br />
              <span className="text-white">could be next.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg text-espresso/75">Tell us about your business. We&apos;ll come back with a clear, honest plan.</p>
          </div>
          <div data-wk-final className="rounded-[28px] bg-white p-6 shadow-[0_40px_80px_-40px_rgba(35,27,24,0.6)] md:p-8 lg:col-span-6">
            <ContactForm />
          </div>
        </Container>
      </section>

      {/* off-screen size reference for the companion dock (no big Sunny on this page) */}
      <div data-sun-slot aria-hidden className="pointer-events-none invisible fixed left-0 top-0 h-[572px] w-[520px]" />
      <SunnyCompanion silent alwaysMini />
    </div>
  );
}
