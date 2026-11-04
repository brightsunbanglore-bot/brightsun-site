"use client";

import { useState } from "react";
import { LogoIntro } from "./LogoIntro";

/** Review page wrapper: replay and speed. (Sound + Skip are built into the intro itself.) */
export function LogoIntroPreview() {
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(() => (typeof window === "undefined" ? 1 : Number(new URLSearchParams(window.location.search).get("speed")) || 1));
  const [done, setDone] = useState(false);
  const btn = "rounded-full px-3 py-2";
  return (
    <>
      <LogoIntro key={`${run}-${speed}`} speed={speed} onComplete={() => setDone(true)} />
      <div className="fixed bottom-4 left-1/2 z-[210] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-espresso shadow-[0_8px_24px_-14px_rgba(35,27,24,0.45)] backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setRun((r) => r + 1);
          }}
          className={`${btn} bg-espresso text-ivory`}
        >
          ↻ Replay
        </button>
        {[0.5, 1, 1.5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setDone(false);
              setSpeed(s);
            }}
            aria-pressed={speed === s}
            className={`${btn} ${speed === s ? "bg-sun" : "bg-transparent"}`}
          >
            {s}×
          </button>
        ))}
        <span className="px-2 text-espresso/60">{done ? "Finished" : "Playing…"}</span>
      </div>
    </>
  );
}
