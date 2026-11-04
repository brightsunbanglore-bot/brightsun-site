/**
 * Sunny's voice and funny sounds.
 *
 * - On by default, but browsers never allow sound before the visitor has
 *   interacted with the page, so Sunny introduces himself right after the first
 *   click / tap / key press (a small hint tells visitors to tap). A button mutes him.
 * - Narration uses the browser's built-in speech synthesis (free, no files),
 *   with a caption bubble so it also works muted or without speech support.
 * - Cartoon sounds (squeak, giggle, boing, whoosh, tada…) are synthesised with
 *   the Web Audio API, so there are no audio files to load.
 * - "Calm Sunny" keeps the explaining voice but silences the funny sounds.
 */
import { cueListeners, mascotState } from "./mascotState";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

let enabled = true;
let unlocked = false; // true once the visitor has clicked / tapped / pressed a key
let caption = "";
let currentScene = "hero";
let arrived = false; // Sunny has finished rolling in
let held = false; // the logo intro is on screen: stay silent and keep Sunny waiting
let quietUntil = 0; // after moving to another page from the menu: no voice, no funny sounds for a few seconds
const isQuiet = () => Date.now() < quietUntil;
const unlockWaiters = new Set<() => void>();
const spoken = new Set<string>();
let captionTimer: ReturnType<typeof setTimeout> | undefined;
let announceTimer: ReturnType<typeof setTimeout> | undefined;

export const subscribeVoice = (l: Listener) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const getVoiceOn = () => enabled;
export const getCaption = () => caption;
/** True while Sunny wants to speak but the browser is still waiting for a first click. */
export const getNeedsTap = () => enabled && !unlocked;

// ---------------------------------------------------------------- scripts ----
/** Playful explainer lines, one per homepage scene (spoken once per visit; Replay repeats). */
export const SCENE_LINES: Record<string, string> = {
  hero: "Wooohooo! Whoa, whoa, okay, I'm here! Hi, I'm Sunny! Yes, the actual sun. Well, the S E O kind. We help your brand get found on Google and in A I search, so people stop asking who are you? Scroll down and let me show you!",
  services: "Ooh, ooh, this is my favorite part! Okay, so, what do we do? S E O! That's how people find you on Google, without you begging them. A I search! Because now even robots are asking for recommendations. Google Ads! Quick results, like instant noodles, but for business. Meta Ads! Facebook and Instagram, where your customers are scrolling right now. And email marketing! Yes, email still works. Don't laugh, it works! Pick one, pick all, I won't judge. Okay, I will, a little. Kidding!",
  journey: "Okay, okay, watch this, this is my favorite trick! Somebody types a search. Wedding photographer near me. Tap, tap, tap. And where's your brand? Way down here. Hiding. Nobody scrolls that far! Not even my mom! But don't panic, we've got a plan. Step one. Discover. We find out what your customers are really searching for. Step two. Optimise. We tune your pages, your structure, and your links, until Google goes, ooooh! And step three. Grow! Look! Your brand starts climbing! One step up! Two! Three! Ha! Whoa, look at that visibility line go! No tricks, no shortcuts. Just research, a user-friendly site, and good links, done properly. Okay, I'll be right here. Cheering. Loudly.",
  work: "These are real brands, real people, and real results. No fake numbers, I promise, I'm a sun, I can't lie. I'd burn. Tap the little dots and check their numbers. More visitors, more calls, more customers. Honestly? I'm a little bit proud. Okay, very proud. Okay, I'm basically glowing. Oh wait, I always glow. Anyway, go on, tap!",
  finale: "Aaaand we made it to the end! So, ready to shine? Your brand has been hiding in the shade for way too long. Here's the easy part. See this little form right here? Pop in your name and your number, tap what you need help with, and hit send. That's it! Ha! No long forms, no boring paperwork, I promise. It takes less time than it takes me to roll across the screen. And don't worry, no spam, ever. Sunny's honor! Prefer to chat? There's a WhatsApp button, too. Okay, thanks for hanging out with me. I'll be right here, glowing. Bye for now!",
};

// ------------------------------------------------------------------ voice ----
const MALE = ["Daniel", "Alex", "Aaron", "Arthur", "Rishi", "Tom", "Fred", "Google UK English Male", "Microsoft Guy", "Microsoft David", "Microsoft Mark", "Microsoft Ryan", "Male"];
function pickVoice(): { voice?: SpeechSynthesisVoice; male: boolean } {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  // A friendly man's voice first (Enhanced / Premium downloads sound best), then any English voice.
  for (const name of MALE) {
    const v = voices.find((x) => x.name.includes(name) && /enhanced|premium/i.test(x.name)) ?? voices.find((x) => x.name.includes(name));
    if (v) return { voice: v, male: true };
  }
  return { voice: voices.find((v) => v.lang === "en-US") ?? voices[0], male: false };
}

/** Optional recorded clips: put /public/sunny/<scene>.mp3 in place and it is used instead of the browser voice. */
let clip: HTMLAudioElement | null = null;

/** `showText`: also show the words in the speech bubble (only when the visitor presses "Say it again"). */
function say(text: string, scene?: string, showText = false) {
  if (!enabled || !unlocked || silentPage) return;
  clearTimeout(captionTimer);
  caption = showText ? text : "";
  emit();
  const hold = () => {
    captionTimer = setTimeout(() => {
      caption = "";
      emit();
    }, 2500);
  };
  const tts = () => speakWithBrowser(text, hold);
  if (scene && typeof Audio !== "undefined") {
    try {
      clip?.pause();
      window.speechSynthesis?.cancel();
      const a = getClip(scene);
      try {
        a.currentTime = 0;
      } catch {
        /* not buffered yet: starts from 0 anyway */
      }
      clip = a;
      hookAnalyser(a);
      a.onended = hold;
      a.onerror = tts; // no recording for this scene: use the browser voice
      void a.play().catch(tts);
      return;
    } catch {
      /* fall through to the browser voice */
    }
  }
  tts();
}

/** Recorded clips are created once and pre-loaded, so the voice starts the instant Sunny does. */
const clips = new Map<string, HTMLAudioElement>();
function getClip(scene: string) {
  let a = clips.get(scene);
  if (!a) {
    a = new Audio(`/sunny/${scene}.mp3`);
    a.preload = "auto";
    clips.set(scene, a);
  }
  return a;
}

// ---- lip sync: measure the loudness of the voice that is playing ----
let analyser: AnalyserNode | null = null;
const hooked = new WeakSet<HTMLAudioElement>();
let ttsSpeaking = false;
const levelBuf = new Uint8Array(256);

function hookAnalyser(a: HTMLAudioElement) {
  if (hooked.has(a)) return;
  const c = audio();
  // Only route the voice through Web Audio when the context is running; otherwise it would be silent (Safari).
  if (!c || c.state !== "running") return;
  try {
    const src = c.createMediaElementSource(a);
    analyser ??= (() => {
      const n = c.createAnalyser();
      n.fftSize = 512;
      n.smoothingTimeConstant = 0.2;
      n.connect(c.destination);
      return n;
    })();
    src.connect(analyser);
    hooked.add(a);
  } catch {
    /* already routed or unsupported: the mouth falls back to a simple flap */
  }
}

/** 0 … 1: how wide Sunny's mouth should be right now (0 = not speaking). */
export function mouthLevel(): number {
  if (clip && !clip.paused && !clip.ended) {
    if (analyser && hooked.has(clip)) {
      analyser.getByteTimeDomainData(levelBuf);
      let sum = 0;
      for (let i = 0; i < levelBuf.length; i++) {
        const v = (levelBuf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / levelBuf.length);
      return Math.max(0, Math.min(1, (rms - 0.015) * 7));
    }
    return 0.45 + 0.4 * Math.abs(Math.sin(performance.now() * 0.014)); // no analyser: just flap along
  }
  if (ttsSpeaking) return 0.35 + 0.45 * Math.abs(Math.sin(performance.now() * 0.013));
  return 0;
}

/** Seconds into this scene's recorded clip if it is playing right now, else -1 (so gestures can be timed to it). */
export function sceneClipTime(scene: string) {
  const a = clips.get(scene);
  return a && clip === a && !a.paused && !a.ended ? a.currentTime : -1;
}

/** True when Sunny's recorded hero voice will play (so his roll-in can be timed to it). */
export function heroVoiceReady() {
  return heroClip && enabled && unlocked && !held && !silentPage;
}

function speakWithBrowser(text: string, hold: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    captionTimer = setTimeout(() => {
      caption = "";
      emit();
    }, Math.max(3500, text.length * 55));
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const { voice: v, male } = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.rate = 0.97; // a touch slower = clearer
    u.pitch = male ? 1.2 : 0.8; // cheerful cartoon man; lowered if no male voice is installed
    u.onstart = () => (ttsSpeaking = true);
    u.onend = () => {
      ttsSpeaking = false;
      hold();
    };
    u.onerror = () => {
      ttsSpeaking = false;
      hold();
    };
    window.speechSynthesis.speak(u);
  } catch {
    hold();
  }
}

/** Called when a scene scrolls in. Speaks that scene's line once per visit. */
export function sunnyNarrate(scene: string) {
  currentScene = scene;
  if (silentPage || isQuiet()) return;
  if (!enabled || !unlocked || held || spoken.has(scene)) return;
  const line = SCENE_LINES[scene];
  if (!line) return;
  spoken.add(scene);
  say(line, scene);
}

/** Repeat the line for the scene the visitor is in. */
export function sunnyReplay() {
  if (silentPage) return;
  const line = SCENE_LINES[currentScene];
  if (line) say(line, currentScene, true);
}

/** Speak about a specific client (debounced so scrolling through cards isn't a stream of speech). */
export function sunnyAnnounce(line: string) {
  clearTimeout(announceTimer);
  if (silentPage || isQuiet()) return;
  if (!enabled) return;
  announceTimer = setTimeout(() => say(line), 900);
}

export function setVoiceOn(on: boolean) {
  enabled = on;
  if (on) {
    unlocked = true; // this call comes from the visitor's click
    sfx("pop");
    sunnyReplay();
  } else {
    try {
      clip?.pause();
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    caption = "";
  }
  emit();
}

if (typeof window !== "undefined") {
  // The first click / tap / key press unlocks sound; Sunny then introduces himself.
  const unlock = () => {
    unlocked = true;
    audio(); // create + resume the audio engine inside this click, which browsers require
    emit();
    if (held) return; // clicks during the logo intro (Skip, tapping the screen) must not start Sunny's hello
    unlockWaiters.forEach((w) => w());
    unlockWaiters.clear();
    // If Sunny already rolled in silently, greet now (a click on the mute button wins: enabled is checked).
    if (arrived) setTimeout(() => sunnyNarrate(currentScene), 350);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

// ------------------------------------------------------------- cartoon sfx ----
type Sfx = "whoop" | "squeak" | "giggle" | "boing" | "pop" | "whoosh" | "tada" | "dizzy" | "wow" | "ping" | "sneeze" | "sneezeSynth";
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(a: AudioContext, type: OscillatorType, f0: number, f1: number, start: number, dur: number, vol = 0.18, vibrato = 0) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, start);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), start + dur);
  if (vibrato) {
    const lfo = a.createOscillator();
    const lg = a.createGain();
    lfo.frequency.value = vibrato;
    lg.gain.value = f0 * 0.08;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(start);
    lfo.stop(start + dur);
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(a.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export function sfx(name: Sfx) {
  if (!enabled || !unlocked || isQuiet()) return;
  if (name === "sneeze") {
    // the recorded "ah… ah… CHOO!" (/public/sunny/sneeze.mp3), else the synthesised one
    const el = new Audio("/sunny/sneeze.mp3");
    el.addEventListener("error", () => sfx("sneezeSynth"));
    el.play().catch(() => sfx("sneezeSynth"));
    return;
  }
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  switch (name) {
    case "whoop": {
      // "Woo-hoo!": a man's voice glide (saw wave through two moving vowel filters)
      const o = a.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(260, t + 0.38);
      o.frequency.setValueAtTime(220, t + 0.5);
      o.frequency.exponentialRampToValueAtTime(330, t + 0.78);
      o.frequency.exponentialRampToValueAtTime(150, t + 1.15);
      const vib = a.createOscillator();
      const vg = a.createGain();
      vib.frequency.value = 7;
      vg.gain.value = 9;
      vib.connect(vg).connect(o.frequency);
      const f1 = a.createBiquadFilter();
      f1.type = "bandpass";
      f1.Q.value = 5;
      f1.frequency.setValueAtTime(330, t);
      f1.frequency.linearRampToValueAtTime(650, t + 0.4);
      f1.frequency.linearRampToValueAtTime(420, t + 1.1);
      const f2 = a.createBiquadFilter();
      f2.type = "bandpass";
      f2.Q.value = 6;
      f2.frequency.setValueAtTime(800, t);
      f2.frequency.linearRampToValueAtTime(1150, t + 0.5);
      f2.frequency.linearRampToValueAtTime(900, t + 1.1);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.06);
      g.gain.setValueAtTime(0.7, t + 0.42);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(f1).connect(g);
      o.connect(f2).connect(g);
      g.connect(a.destination);
      o.start(t);
      vib.start(t);
      o.stop(t + 1.25);
      vib.stop(t + 1.25);
      break;
    }
    case "squeak":
      tone(a, "triangle", 900, 1900, t, 0.13);
      tone(a, "sine", 1300, 2300, t + 0.1, 0.1, 0.1);
      break;
    case "giggle":
      for (let i = 0; i < 5; i++) tone(a, "triangle", 620 + (i % 2) * 220 + i * 25, 780 + (i % 2) * 220, t + i * 0.095, 0.075, 0.16);
      break;
    case "boing":
      tone(a, "sine", 180, 520, t, 0.45, 0.22, 14);
      break;
    case "pop":
      tone(a, "sine", 700, 140, t, 0.09, 0.22);
      break;
    case "whoosh": {
      const len = a.sampleRate * 0.5;
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.45);
      const g = a.createGain();
      g.gain.value = 0.22;
      src.connect(f).connect(g).connect(a.destination);
      src.start(t);
      break;
    }
    case "tada":
      [523, 659, 784, 1047].forEach((f, i) => tone(a, "triangle", f, f * 1.01, t + i * 0.09, i === 3 ? 0.5 : 0.14, 0.16));
      break;
    case "dizzy":
      tone(a, "sine", 700, 220, t, 0.9, 0.18, 9);
      break;
    case "wow":
      tone(a, "triangle", 320, 900, t, 0.22, 0.17);
      tone(a, "triangle", 900, 520, t + 0.22, 0.25, 0.17);
      break;
    case "ping":
      tone(a, "sine", 1320, 1320, t, 0.18, 0.14);
      break;
    case "sneezeSynth": {
      // "ahh… ahh… CHOO!": two rising breathy "ah"s, then a noise burst with a falling squeal
      const vowel = (st: number, dur: number, f0: number, f1: number) => {
        const o = a.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(f0, st);
        o.frequency.exponentialRampToValueAtTime(f1, st + dur);
        const bp = a.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 4;
        bp.frequency.value = 800;
        const g = a.createGain();
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.35, st + dur * 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
        o.connect(bp).connect(g).connect(a.destination);
        o.start(st);
        o.stop(st + dur + 0.02);
      };
      vowel(t, 0.22, 170, 240);
      vowel(t + 0.22, 0.18, 200, 300);
      const nb = a.createBuffer(1, Math.floor(a.sampleRate * 0.25), a.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const ns = a.createBufferSource();
      ns.buffer = nb;
      const hp = a.createBiquadFilter();
      hp.type = "bandpass";
      hp.frequency.value = 2200;
      hp.Q.value = 0.7;
      const ng = a.createGain();
      ng.gain.setValueAtTime(0.9, t + 0.42);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.67);
      ns.connect(hp).connect(ng).connect(a.destination);
      ns.start(t + 0.42);
      tone(a, "sawtooth", 700, 260, t + 0.42, 0.3, 0.2);
      tone(a, "sine", 1500, 500, t + 0.62, 0.2, 0.08, 14);
      break;
    }
  }
}

/** Funny sounds respect "Calm Sunny"; the explaining voice does not. */
function fun(name: Sfx) {
  if (!mascotState.calm) sfx(name);
}
export const sunnyFun = fun;

// Sound for the acts the scenes cue.
const CUE_SFX: Record<string, Sfx> = {
  celebrate: "tada",
  goodbye: "whoosh",
  "surprise-work": "boing",
};
// Is there a recorded intro (/public/sunny/hero.mp3)? Then it carries its own "woo-hoo" and plays as he rolls in.
let heroClip = false;
if (typeof window !== "undefined") {
  // buffer the scene clips too, if they have been recorded
  ["services", "work", "journey", "finale"].forEach((name) =>
    fetch(`/sunny/${name}.mp3`, { method: "HEAD" })
      .then((r) => {
        if (r.ok && /audio/i.test(r.headers.get("content-type") ?? "")) getClip(name);
      })
      .catch(() => {}),
  );
  fetch("/sunny/hero.mp3", { method: "HEAD" })
    .then((r) => {
      heroClip = r.ok && /audio/i.test(r.headers.get("content-type") ?? "");
      if (heroClip) getClip("hero"); // buffer it now so the voice starts instantly
    })
    .catch(() => {});
}
cueListeners.add((name) => {
  if (name === "rollin") {
    if (heroClip && enabled && unlocked && !silentPage) return void sunnyNarrate("hero");
    return void sfx("whoop");
  }
  if (name === "arrive") {
    arrived = true;
    return void sunnyNarrate("hero");
  }
  const s = CUE_SFX[name];
  if (s) fun(s);
});

/** Spoken-form numbers for client lines: 7450 -> "7.45 thousand". */
export function spokenNumber(n: number) {
  if (n >= 1e6) return `${Number((n / 1e6).toPrecision(3))} million`;
  if (n >= 1e3) return `${Number((n / 1e3).toPrecision(3))} thousand`;
  return String(Math.round(n));
}

/**
 * Resolves when the browser lets Sunny make sound (first click / tap / key), or after
 * `maxMs`, or immediately if he is muted / already unlocked. Used to hold his roll-in so
 * the "woo-hoo" and his hello land with the entrance.
 */
/**
 * The logo intro calls this: while `on`, Sunny stays quiet and his roll-in waits, even if the
 * visitor clicks (Skip, tapping the screen). When released, he rolls in and says hello.
 */
export function holdSunny(on: boolean) {
  held = on;
  if (!on && unlocked) {
    unlockWaiters.forEach((w) => w());
    unlockWaiters.clear();
    if (arrived) setTimeout(() => sunnyNarrate(currentScene), 350);
  }
}

export function whenSoundReady(maxMs: number): Promise<void> {
  if (!enabled || (unlocked && !held) || typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(t);
      unlockWaiters.delete(done);
      resolve();
    };
    const t = setTimeout(done, maxMs);
    unlockWaiters.add(done);
  });
}


// ------------------------------------------------------------- snoring ----
let snoreTimer: ReturnType<typeof setInterval> | undefined;

function snoreOnce() {
  if (!enabled || !unlocked) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.02;
  // breath in (rasping rise) then out (low rumble), noise + a flappy 28 Hz saw
  const flap = (st: number, dur: number, f: number, vol: number) => {
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f, st);
    o.frequency.linearRampToValueAtTime(f * 0.8, st + dur);
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const am = a.createGain();
    am.gain.value = 0.5;
    const lfo = a.createOscillator();
    lfo.frequency.value = 26;
    const lg = a.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg).connect(am.gain);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(vol, st + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    o.connect(lp).connect(am).connect(g).connect(a.destination);
    o.start(st);
    lfo.start(st);
    o.stop(st + dur + 0.02);
    lfo.stop(st + dur + 0.02);
  };
  const breath = (st: number, dur: number, vol: number, freq: number) => {
    const nb = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = a.createBufferSource();
    ns.buffer = nb;
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = 0.8;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(vol, st + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    ns.connect(bp).connect(g).connect(a.destination);
    ns.start(st);
  };
  flap(t, 1.0, 85, 0.5);
  breath(t, 1.0, 0.25, 600);
  flap(t + 1.25, 1.2, 62, 0.6);
  breath(t + 1.25, 1.2, 0.18, 300);
}

let snoreClip: HTMLAudioElement | null = null;

/** Plays the recorded snore (/public/sunny/snore.mp3) in a loop while `alive()` stays true; falls back to the synthesised one. */
export function startSnore(alive: () => boolean) {
  stopSnore();
  if (!enabled || !unlocked || isQuiet() || typeof window === "undefined") return;
  const synth = () => {
    snoreOnce();
    snoreTimer = setInterval(() => {
      if (!alive()) return stopSnore();
      snoreOnce();
    }, 3200);
  };
  const el = new Audio("/sunny/snore.mp3");
  el.loop = true;
  el.volume = 1;
  snoreClip = el;
  el.addEventListener("error", () => {
    if (snoreClip === el) synth();
  });
  el.play().catch(() => {
    if (snoreClip === el) synth();
  });
  snoreTimer = setInterval(() => {
    if (!alive()) stopSnore();
  }, 500);
}
export function stopSnore() {
  if (snoreTimer) clearInterval(snoreTimer);
  snoreTimer = undefined;
  if (snoreClip) {
    snoreClip.pause();
    snoreClip = null;
  }
}


// ------------------------------------------------------------- mute ----
const MUTE_KEY = "brightsun:mute-sunny";
const MUTE_EVENT = "brightsun:mute-change";

export function isMuted() {
  return mascotState.muted;
}

/** Mute Sunny completely (voice, sound effects, snoring) or let him talk again. Remembered between visits. */
export function setMuted(on: boolean) {
  mascotState.muted = on;
  try {
    window.localStorage.setItem(MUTE_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable: just for this page view */
  }
  if (on) {
    enabled = false;
    stopSnore();
    try {
      clip?.pause();
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    caption = "";
    emit();
  } else {
    enabled = true;
    unlocked = true; // comes from the visitor's click
    emit();
    sfx("pop");
  }
  window.dispatchEvent(new Event(MUTE_EVENT));
}

export function subscribeMute(cb: () => void) {
  window.addEventListener(MUTE_EVENT, cb);
  return () => window.removeEventListener(MUTE_EVENT, cb);
}

if (typeof window !== "undefined") {
  try {
    if (window.localStorage.getItem(MUTE_KEY) === "1") {
      mascotState.muted = true;
      enabled = false;
    }
  } catch {
    /* ignore */
  }
}


// ------------------------------------------------------------- silent pages ----
let silentPage = false;
/** Pages where Sunny never talks (e.g. Services): sound effects still play, no voice at all. */
export function setSilentPage(on: boolean) {
  silentPage = on;
  if (on) {
    try {
      clip?.pause();
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }
}
export function isSilentPage() {
  return silentPage;
}


// ------------------------------------------------------------- menu taps ----

/** Moving to another page from the menu: stop anything playing and keep Sunny quiet for a few seconds while the new page opens. */
export function quietSunny(ms = 1e12) {
  quietUntil = Date.now() + ms;
  stopSnore();
  try {
    clip?.pause();
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
  caption = "";
  emit();
}

/** A clean, normal button "click" for menu and link clicks (not a cartoon sound). Respects the mute button. */
let tapClip: HTMLAudioElement | null = null;
export function uiTap() {
  if (mascotState.muted || typeof window === "undefined") return;
  // the sound file for menu switches: /public/sounds/menu-switch.mp3 (swap the file to change the sound)
  try {
    if (!tapClip) {
      tapClip = new Audio("/sounds/menu-switch.mp3");
      tapClip.preload = "auto";
    }
    const el = tapClip.cloneNode(true) as HTMLAudioElement; // a fresh copy so quick clicks can overlap
    el.volume = 0.7;
    el.addEventListener("error", () => uiTapSynth());
    el.play().catch(() => uiTapSynth());
    return;
  } catch {
    /* fall back to the built-in click */
  }
  uiTapSynth();
}

function uiTapSynth() {
  const a = audio(); // created inside the visitor's click, which browsers allow
  if (!a) return;
  const t = a.currentTime + 0.005;
  const out = a.createGain();
  out.gain.value = 0.9;
  out.connect(a.destination);
  // bright "tick"
  const o1 = a.createOscillator();
  const g1 = a.createGain();
  o1.type = "triangle";
  o1.frequency.setValueAtTime(1500, t);
  o1.frequency.exponentialRampToValueAtTime(700, t + 0.045);
  g1.gain.setValueAtTime(0.0001, t);
  g1.gain.exponentialRampToValueAtTime(0.32, t + 0.004);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o1.connect(g1).connect(out);
  o1.start(t);
  o1.stop(t + 0.09);
  // soft body underneath
  const o2 = a.createOscillator();
  const g2 = a.createGain();
  o2.type = "sine";
  o2.frequency.setValueAtTime(420, t);
  o2.frequency.exponentialRampToValueAtTime(240, t + 0.08);
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.exponentialRampToValueAtTime(0.28, t + 0.006);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o2.connect(g2).connect(out);
  o2.start(t);
  o2.stop(t + 0.14);
}

/** The visitor poked Sunny himself: his funny sounds are welcome again. */
export function wakeSunnySound() {
  quietUntil = 0;
}
