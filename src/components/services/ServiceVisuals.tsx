import type { ServiceVisual } from "@/data/services";
import { SunScrub } from "./SunScrub";
import { FunnelCanvas } from "./FunnelCanvas";

/**
 * Live illustrations for the Services chapters (illustrative only: no real data or numbers).
 * Everything is SVG/CSS; loops run only while the chapter is on screen (`[data-live]` on an
 * ancestor) and stop under reduced motion.
 */
export const SVC_CSS = `
.sv *{animation-play-state:paused}
[data-live] .sv *{animation-play-state:running}
@media (prefers-reduced-motion: reduce){.sv *{animation:none!important}}
.sv{position:relative;width:100%;height:100%;overflow:hidden;border-radius:24px;font-family:inherit}
@keyframes sv-dash{to{stroke-dashoffset:0}}
@keyframes sv-pulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.18);opacity:1}}
@keyframes sv-glow{0%,100%{box-shadow:0 0 0 0 rgba(255,138,29,.45)}50%{box-shadow:0 0 0 14px rgba(255,138,29,0)}}
@keyframes sv-flow{to{stroke-dashoffset:-40}}
@keyframes sv-type{0%{width:0}60%,100%{width:var(--w)}}
@keyframes sv-wave{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@keyframes sv-pop{0%{transform:translateY(14px) scale(.9);opacity:0}12%,88%{transform:none;opacity:1}100%{transform:translateY(-6px);opacity:0}}
@keyframes sv-climb{0%,18%{transform:translateY(calc(var(--step) * 3))}40%{transform:translateY(calc(var(--step) * 2))}62%{transform:translateY(var(--step))}80%,100%{transform:translateY(0)}}
@keyframes sv-sink{0%,18%{transform:translateY(calc(var(--step) * -1))}80%,100%{transform:translateY(0)}}
@keyframes sv-drop{0%{transform:translate(-50%,-160%);opacity:0}30%{transform:translate(-50%,0);opacity:1}38%{transform:translate(-50%,-18%)}46%,100%{transform:translate(-50%,0);opacity:1}}
@keyframes sv-ring{0%{transform:translate(-50%,-50%) scale(.2);opacity:.8}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}
@keyframes sv-star{0%,30%{transform:scale(0)}45%{transform:scale(1.3)}55%,100%{transform:scale(1)}}
@keyframes sv-needle{0%{transform:rotate(-100deg)}55%,85%{transform:rotate(70deg)}100%{transform:rotate(-100deg)}}
@keyframes sv-check{0%,20%{stroke-dashoffset:24}40%,100%{stroke-dashoffset:0}}
@keyframes sv-cursor{0%{transform:translate(160px,120px)}35%{transform:translate(70px,52px)}45%{transform:translate(70px,52px) scale(.85)}55%,100%{transform:translate(70px,52px)}}
@keyframes sv-click{0%,40%{transform:translate(-50%,-50%) scale(0);opacity:0}45%{opacity:.7}70%,100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
@keyframes sv-feed{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
@keyframes sv-heart{0%{transform:translate(0,0) scale(.4);opacity:0}15%{opacity:1}100%{transform:translate(var(--hx),-150px) scale(1.2);opacity:0}}
@keyframes sv-flap{0%,15%{transform:rotateX(0)}35%,75%{transform:rotateX(180deg)}95%,100%{transform:rotateX(0)}}
@keyframes sv-letter{0%,25%{transform:translateY(40%)}45%,70%{transform:translateY(-38%)}90%,100%{transform:translateY(40%)}}
@keyframes sv-row{0%{transform:translateX(110%);opacity:0}15%,85%{transform:none;opacity:1}100%{transform:translateX(-30%);opacity:0}}
@keyframes sv-fall{0%{transform:translate(var(--fx),-30px);opacity:0}10%{opacity:1}55%{transform:translate(calc(var(--fx) * .25),120px)}100%{transform:translate(0,210px);opacity:1}}
@keyframes sv-btn{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes sv-spin{to{transform:rotate(360deg)}}
@keyframes sv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes sv-blink{0%,49%{opacity:1}50%,100%{opacity:0}}

@keyframes ai-type{0%{width:0}14%,88%{width:100%}96%,100%{width:0}}
@keyframes ai-row{0%,16%{opacity:0;transform:translateX(26px) scale(.96)}24%,88%{opacity:1;transform:none}96%,100%{opacity:0;transform:translateX(-10px)}}
@keyframes ai-bar{0%,22%{transform:scaleX(0)}34%,88%{transform:scaleX(1)}96%,100%{transform:scaleX(0)}}
@keyframes ai-draft{0%,40%{opacity:1}46%,100%{opacity:0}}
@keyframes ai-done{0%,44%{opacity:0;transform:scale(.7)}52%,88%{opacity:1;transform:none}96%,100%{opacity:0}}
@keyframes ai-orbit{to{transform:rotate(360deg)}}
@keyframes ai-beam{0%,6%{left:0;opacity:0}12%{opacity:1}26%{left:100%;opacity:1}30%,100%{left:100%;opacity:0}}
@keyframes ai-scan{0%,18%{transform:translateY(0);opacity:0}22%{opacity:1}70%{transform:translateY(174px);opacity:1}76%,100%{transform:translateY(174px);opacity:0}}
@keyframes ai-spark{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:1}100%{transform:translate(var(--sx),var(--sy)) scale(1);opacity:0}}
@keyframes ai-think{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}

@keyframes ab-win{0%,58%{transform:none;box-shadow:0 18px 40px -26px rgba(35,27,24,.5)}68%,92%{transform:translateY(-8px) scale(1.035);box-shadow:0 34px 60px -24px rgba(255,138,29,.65),0 0 0 2px #FFC233}98%,100%{transform:none;box-shadow:0 18px 40px -26px rgba(35,27,24,.5)}}
@keyframes ab-lose{0%,58%{opacity:1;filter:none}68%,92%{opacity:.5;filter:saturate(.4);transform:scale(.97)}98%,100%{opacity:1;filter:none;transform:none}}
@keyframes ab-fillA{0%{transform:scaleX(.04)}60%,92%{transform:scaleX(.34)}98%,100%{transform:scaleX(.04)}}
@keyframes ab-fillB{0%{transform:scaleX(.04)}60%,92%{transform:scaleX(.86)}98%,100%{transform:scaleX(.04)}}
@keyframes ab-cursor{0%{transform:translate(-40px,60px);opacity:0}8%{opacity:1}30%{transform:translate(0,0)}36%{transform:translate(0,0) scale(.85)}40%{transform:translate(0,0) scale(1)}56%{transform:translate(0,0);opacity:1}64%,100%{transform:translate(30px,40px);opacity:0}}
@keyframes ab-ripple{0%,34%{transform:scale(0);opacity:0}36%{opacity:.8}52%,100%{transform:scale(3.4);opacity:0}}
@keyframes ab-badge{0%,60%{transform:translateY(-26px) scale(.5);opacity:0}68%{transform:translateY(0) scale(1.15);opacity:1}72%,92%{transform:none;opacity:1}98%,100%{opacity:0}}
@keyframes ab-dot{0%{transform:translateY(-14px);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(34px);opacity:0}}
@keyframes ab-confetti{0%,62%{transform:translate(0,0) rotate(0);opacity:0}66%{opacity:1}92%,100%{transform:translate(var(--cx),var(--cy)) rotate(var(--cr));opacity:0}}
@keyframes ab-cta{0%,30%{background-position:0 0}100%{background-position:0 0}}

@keyframes fn-p{0%{transform:translate(var(--x),0);opacity:0;fill:#CBBFB6}7%{opacity:1}35%{transform:translate(calc(var(--x)*.72),80px);fill:#E8C98A}66%{transform:translate(calc(var(--x)*.2),210px);fill:#FFC233}92%{opacity:1}100%{transform:translate(0,318px);opacity:0;fill:#FF8A1D}}
@keyframes fn-gate{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes fn-sheen{0%,30%{transform:translateX(-140px) skewX(-18deg);opacity:0}45%{opacity:.9}70%,100%{transform:translateX(480px) skewX(-18deg);opacity:0}}
@keyframes fn-ring{0%{transform:scale(.3);opacity:.75}100%{transform:scale(2.6);opacity:0}}
@keyframes fn-orb{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes fn-drift{0%{transform:translate(0,0)}100%{transform:translate(26px,-18px)}}
@keyframes fn-liquid{to{transform:translateY(-60px)}}
@keyframes fn-btn{0%,82%,100%{transform:none}88%{transform:scale(.94)}94%{transform:scale(1.04)}}
`;

const card = "absolute rounded-2xl bg-white shadow-[0_12px_30px_-18px_rgba(35,27,24,0.5)]";
const bar = (w: string, c = "bg-espresso/12") => <span className={`block h-2 rounded-full ${c}`} style={{ width: w }} />;

function AiVisual() {
  return <SunScrub />;
}

function AeoVisual() {
  return (
    <div className="sv bg-[linear-gradient(160deg,#FFF6E3,#FFFDF7)] p-5">
      <div className="flex items-center gap-2 rounded-full border border-espresso/10 bg-white px-4 py-2.5 text-[13px] text-espresso/70">
        <span className="text-flame">●</span> how do I choose a good dentist?
        <span className="ml-auto h-4 w-px bg-espresso/50" style={{ animation: "sv-blink 1s steps(1) infinite" }} />
      </div>
      <div className="mt-4 rounded-2xl border-2 border-sun bg-white p-4 shadow-[0_14px_30px_-20px_rgba(35,27,24,0.5)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-flame">Featured answer</p>
        <div className="mt-3 space-y-2">
          {["92%", "78%", "86%", "54%"].map((w, i) => (
            <span
              key={i}
              className="block h-2.5 overflow-hidden rounded-full bg-espresso/15"
              style={{ ["--w" as string]: w, width: w, animation: `sv-type 4s ease-out ${i * 0.35}s infinite` }}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] font-semibold text-espresso/60">yourbrand.com</p>
      </div>
      <div className="absolute bottom-5 left-5 flex h-10 items-end gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="block h-10 w-1.5 origin-bottom rounded-full bg-flame" style={{ animation: `sv-wave 0.9s ease-in-out ${i * 0.09}s infinite` }} />
        ))}
      </div>
      <span className="absolute bottom-6 left-24 text-[11px] font-semibold text-espresso/55">“Hey, who’s a good dentist?”</span>
    </div>
  );
}

function GeoVisual() {
  return (
    <div className="sv bg-[linear-gradient(200deg,#FFF3DC,#FFFDF7)] p-5">
      <div className="ml-auto w-[70%] rounded-2xl rounded-br-sm bg-espresso px-4 py-2.5 text-[12px] text-ivory" style={{ animation: "sv-pop 6s ease-out infinite" }}>
        Best running shoes for beginners?
      </div>
      <div className="mt-3 w-[85%] rounded-2xl rounded-bl-sm bg-white p-4 shadow-[0_14px_30px_-20px_rgba(35,27,24,0.5)]" style={{ animation: "sv-pop 6s ease-out 0.6s infinite" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[conic-gradient(#FFC233,#FF8A1D,#FFC233)] text-[10px]" style={{ animation: "sv-spin 4s linear infinite" }}>✦</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-espresso/50">AI answer</span>
        </div>
        <div className="mt-3 space-y-2">
          {bar("95%")}
          {bar("80%")}
          {bar("88%")}
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun/40 px-2.5 py-1 text-[11px] font-bold text-espresso" style={{ animation: "sv-glow 1.8s ease-out infinite" }}>
          ☀ yourbrand.com <span className="text-flame">[1]</span>
        </span>
      </div>
      {[
        { t: "ChatGPT", src: "/ai-logos/chatgpt.png", h: 20 },
        { t: "Gemini", src: "/ai-logos/gemini.png", h: 20 },
        { t: "Perplexity", src: "/ai-logos/perplexity.png", h: 20 },
      ].map((l, i) => (
        <span
          key={l.t}
          className="absolute flex items-center gap-2 rounded-full border border-espresso/10 bg-white py-2 pl-3 pr-4 shadow-[0_10px_22px_-14px_rgba(35,27,24,0.55)]"
          style={{ right: `${8 + i * 6}%`, bottom: `${10 + i * 11}%`, animation: `sv-float ${2.6 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.src} alt="" aria-hidden height={l.h} style={{ height: l.h, width: "auto" }} draggable={false} />
          <span className="text-[13px] font-semibold text-espresso/75">{l.t}</span>
        </span>
      ))}
    </div>
  );
}

function SeoVisual() {
  const step = "52px";
  return (
    <div className="sv bg-[linear-gradient(160deg,#FFFDF7,#FFF3DC)] p-5" style={{ ["--step" as string]: step }}>
      <div className="flex items-center gap-2 rounded-full border border-espresso/10 bg-white px-4 py-2 text-[12px] text-espresso/70">🔍 best coffee shop near me</div>
      <div className="relative mt-4 h-[212px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 flex h-11 items-center gap-3 rounded-xl bg-white/70 px-3"
            style={{ top: `calc(${i + 1} * ${step})`, animation: "sv-sink 4.5s cubic-bezier(.6,0,.3,1) infinite" }}
          >
            <span className="h-6 w-6 rounded-full bg-espresso/10" />
            <span className="flex-1 space-y-1.5">{bar("40%")}{bar("75%", "bg-espresso/8")}</span>
          </div>
        ))}
        <div
          className="absolute left-0 right-0 top-0 z-10 flex h-11 items-center gap-3 rounded-xl bg-cream px-3 ring-2 ring-sun"
          style={{ animation: "sv-climb 4.5s cubic-bezier(.6,0,.3,1) infinite" }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sun text-[12px]">☀</span>
          <span className="text-[13px] font-bold text-espresso">Your brand</span>
          <span className="ml-auto rounded-full bg-flame px-2 py-0.5 text-[10px] font-bold text-white">↑</span>
        </div>
      </div>
    </div>
  );
}

function LocalVisual() {
  return (
    <div className="sv bg-[#FFF6E3]">
      <svg viewBox="0 0 200 150" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <rect width="200" height="150" fill="#FFF6E3" />
        <path d="M0 40 H200 M0 100 H200 M60 0 V150 M140 0 V150 M0 140 L200 10" stroke="#fff" strokeWidth="9" />
        <path d="M0 40 H200 M0 100 H200 M60 0 V150 M140 0 V150" stroke="#231b18" strokeOpacity=".06" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="30" cy="125" r="14" fill="#cfe9c4" />
        <circle cx="175" cy="60" r="18" fill="#cfe9c4" />
      </svg>
      <span className="absolute left-1/2 top-[58%] h-16 w-16 rounded-full border-2 border-flame" style={{ animation: "sv-ring 2.4s ease-out 0.7s infinite" }} />
      <span className="absolute left-1/2 top-[58%] h-16 w-16 rounded-full border-2 border-flame" style={{ animation: "sv-ring 2.4s ease-out 1.5s infinite" }} />
      <span className="absolute left-1/2 top-[30%] text-[56px] leading-none drop-shadow-[0_10px_8px_rgba(0,0,0,0.2)]" style={{ animation: "sv-drop 2.4s cubic-bezier(.5,0,.5,1) infinite" }}>
        📍
      </span>
      <div className={`${card} bottom-4 left-4 right-4 flex items-center gap-3 p-3`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun text-lg">☀</span>
        <span>
          <span className="block text-[12px] font-bold text-espresso">Your business</span>
          <span className="flex gap-0.5 text-[12px] text-sun">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="inline-block" style={{ animation: `sv-star 3s ease-out ${i * 0.12}s infinite` }}>
                ★
              </span>
            ))}
          </span>
        </span>
        <span className="ml-auto rounded-full bg-espresso px-3 py-1 text-[10px] font-bold text-ivory">Directions</span>
      </div>
    </div>
  );
}

function TechVisual() {
  return (
    <div className="sv bg-espresso p-5 text-ivory">
      <div className="relative mx-auto mt-2 h-[120px] w-[220px]">
        <svg viewBox="0 0 220 120" className="absolute inset-0">
          <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="#ffffff22" strokeWidth="14" strokeLinecap="round" />
          <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round" />
          <defs>
            <linearGradient id="g">
              <stop offset="0" stopColor="#FF8A1D" />
              <stop offset="1" stopColor="#7be07b" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute bottom-[10px] left-1/2 h-[84px] w-1.5 -translate-x-1/2 origin-bottom rounded-full bg-sun" style={{ animation: "sv-needle 3.2s cubic-bezier(.4,1.6,.5,1) infinite" }} />
        <span className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-sun" />
      </div>
      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ivory/50">Page speed</p>
      <ul className="mt-4 space-y-2 font-mono text-[12px]">
        {["crawlable", "indexed", "schema.org", "core web vitals"].map((t, i) => (
          <li key={t} className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M4 12l5 5 11-11" fill="none" stroke="#7be07b" strokeWidth="3" strokeDasharray="24" style={{ animation: `sv-check 3.2s ease-out ${i * 0.25}s infinite` }} />
            </svg>
            <span className="text-ivory/80">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GadsVisual() {
  return (
    <div className="sv bg-[linear-gradient(160deg,#FFFDF7,#FFF6E3)] p-5">
      <div className="flex items-center gap-2 rounded-full border border-espresso/10 bg-white px-4 py-2 text-[12px] text-espresso/70">🔍 custom cakes near me</div>
      <div className="relative mt-4 rounded-2xl border-2 border-sun bg-white p-4">
        <p className="text-[10px] font-bold text-espresso">
          Sponsored · <span className="text-flame">yourbrand.com</span>
        </p>
        <p className="mt-1 font-hero text-[17px] font-bold text-[#1a49c9]">Your Brand — Grow Online Today</p>
        <div className="mt-2 space-y-1.5">{bar("90%")}{bar("70%", "bg-espresso/8")}</div>
        <span className="absolute left-[70px] top-[52px] h-10 w-10 rounded-full bg-flame/50" style={{ animation: "sv-click 3s ease-out infinite" }} />
      </div>
      <div className="mt-3 space-y-2 opacity-60">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl bg-white/70 p-3">{bar("55%")}<span className="mt-1.5 block">{bar("80%", "bg-espresso/8")}</span></div>
        ))}
      </div>
      <svg viewBox="0 0 24 24" className="absolute left-5 top-5 h-7 w-7 drop-shadow" style={{ animation: "sv-cursor 3s cubic-bezier(.5,0,.3,1) infinite" }}>
        <path d="M3 2l7 19 2.5-7.5L20 11z" fill="#231b18" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function MetaVisual() {
  const post = (i: number, key: number) => (
    <div key={key} className="mb-3 rounded-xl bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-5 w-5 rounded-full ${i % 2 ? "bg-sun" : "bg-flame/60"}`} />
        {bar("40%")}
      </div>
      <div className={`mt-2 h-20 rounded-lg ${i % 3 === 0 ? "bg-[linear-gradient(135deg,#FFC233,#FF8A1D)]" : i % 3 === 1 ? "bg-espresso/10" : "bg-cream"}`} />
    </div>
  );
  return (
    <div className="sv flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#FFF3DC,#FFFDF7)]">
      <div className="relative h-[92%] w-[46%] min-w-[150px] overflow-hidden rounded-[26px] border-[6px] border-espresso bg-ivory">
        <div className="p-2.5" style={{ animation: "sv-feed 7s linear infinite" }}>
          {[0, 1, 2, 3, 0, 1, 2, 3].map((n, i) => post(n, i))}
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute bottom-[18%] right-[22%] text-[22px] text-[#FF3040] drop-shadow-[0_2px_4px_rgba(255,48,64,0.35)]"
          style={{ ["--hx" as string]: `${(i % 2 ? 1 : -1) * (10 + i * 8)}px`, animation: `sv-heart 2.8s ease-out ${i * 0.55}s infinite` }}
        >
          ♥
        </span>
      ))}
      <span className="absolute left-[8%] top-[14%] flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2 pr-3.5 text-[12px] font-bold text-espresso shadow" style={{ animation: "sv-float 3s ease-in-out infinite" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/social-logos/facebook.png" alt="" aria-hidden style={{ height: 20, width: 20 }} draggable={false} />
        Facebook
      </span>
      <span className="absolute bottom-[14%] left-[10%] flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2 pr-3.5 text-[12px] font-bold text-espresso shadow" style={{ animation: "sv-float 3.4s ease-in-out 0.4s infinite" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/social-logos/instagram.png" alt="" aria-hidden style={{ height: 20, width: 20 }} draggable={false} />
        Instagram
      </span>
    </div>
  );
}

function EmailVisual() {
  return (
    <div className="sv bg-[linear-gradient(200deg,#FFF6E3,#FFFDF7)] p-5">
      <div className="relative mx-auto mt-1 h-[120px] w-[170px]" style={{ perspective: "600px" }}>
        <div className="absolute inset-x-3 bottom-4 top-0 rounded-md bg-white p-3 shadow" style={{ animation: "sv-letter 4s ease-in-out infinite" }}>
          <p className="text-[10px] font-bold text-flame">Hi there ☀</p>
          <div className="mt-2 space-y-1.5">{bar("90%")}{bar("70%")}</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[78px] rounded-b-lg bg-sun" style={{ clipPath: "polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)" }} />
        <div
          className="absolute inset-x-0 top-[42px] h-[56px] origin-top rounded-t-lg bg-flame"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", animation: "sv-flap 4s ease-in-out infinite", backfaceVisibility: "visible" }}
        />
      </div>
      <div className="mt-4 space-y-2">
        {["Welcome to the family", "Your weekly tips", "Something you left behind"].map((t, i) => (
          <div key={t} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] text-espresso shadow-sm" style={{ animation: `sv-row 6s ease-in-out ${i * 0.5}s infinite` }}>
            <span className="h-2 w-2 rounded-full bg-flame" />
            <span className="font-semibold">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CroVisual() {
  return <FunnelCanvas />;
}

export function SvcVisual({ kind }: { kind: ServiceVisual }) {
  switch (kind) {
    case "ai":
      return <AiVisual />;
    case "aeo":
      return <AeoVisual />;
    case "geo":
      return <GeoVisual />;
    case "seo":
      return <SeoVisual />;
    case "local":
      return <LocalVisual />;
    case "tech":
      return <TechVisual />;
    case "gads":
      return <GadsVisual />;
    case "meta":
      return <MetaVisual />;
    case "email":
      return <EmailVisual />;
    case "cro":
      return <CroVisual />;
  }
}
