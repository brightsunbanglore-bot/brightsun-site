/**
 * Original sound design for the BrightSun logo intro, synthesized in the browser (no audio
 * files, nothing to license).
 *
 * Direction: light comedic chamber feel. Pizzicato-style plucks, a soft walking ostinato, a
 * woody tick, a gentle slide whistle and a bright glockenspiel sting, through a small room
 * reverb at a low master level. Tasteful, not noisy.
 *
 * Nothing plays until `unlock()` is called from a user gesture (the Sound button), so the
 * website never autoplays audio. The intro calls `cue(...)` on its animation beats.
 */

export type IntroCue =
  | "letter"
  | "enter"
  | "push"
  | "land"
  | "tilt"
  | "notice"
  | "funny"
  | "scamper"
  | "fix"
  | "climb"
  | "sit"
  | "sting";

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

export type IntroSound = {
  /** Call from a click / tap / key handler. Resolves true once audio can play. */
  unlock: () => Promise<boolean>;
  ready: () => boolean;
  /** Mute without losing the unlocked context. */
  setMuted: (m: boolean) => void;
  cue: (name: IntroCue, index?: number) => void;
  /** Schedule a cue at an absolute context time (used for offline soundtrack rendering). */
  cueAt: (name: IntroCue, t: number, index?: number) => void;
  /** Offline only: close the music bed at the end of the render. */
  endAt: (t: number) => void;
  /** Stop the music bed and fade everything out. */
  stop: () => void;
};

export function createIntroSound(volume = 0.5, offline?: BaseAudioContext): IntroSound {
  let ctx: BaseAudioContext | null = null;
  let musicFrom = -1; // offline: when the bed started
  let master: GainNode | null = null;
  let wet: GainNode | null = null;
  let muted = false;
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let musicStep = 0;
  let nextBeat = 0;

  const ensure = () => {
    if (ctx) return ctx;
    if (offline) ctx = offline;
    else {
      if (typeof window === "undefined") return null;
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    master = ctx.createGain();
    master.gain.value = volume;
    const rev = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    rev.buffer = ir;
    wet = ctx.createGain();
    wet.gain.value = 0.22;
    wet.connect(rev).connect(master);
    master.connect(ctx.destination);
    return ctx;
  };

  const out = (node: AudioNode, send = 1) => {
    if (!master || !wet || !ctx) return;
    node.connect(master);
    if (send > 0) {
      const s = ctx.createGain();
      s.gain.value = send;
      node.connect(s).connect(wet);
    }
  };

  /** Pizzicato-like pluck. */
  const pluck = (freq: number, t: number, vol = 0.18, decay = 0.45, send = 1) => {
    const a = ctx!;
    const g = a.createGain();
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(Math.min(9000, freq * 7), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.4), t + decay);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    [1, 2.0, 3.01].forEach((h, i) => {
      const o = a.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.value = freq * h;
      const og = a.createGain();
      og.gain.value = i === 0 ? 1 : i === 1 ? 0.35 : 0.12;
      o.connect(og).connect(f);
      o.start(t);
      o.stop(t + decay + 0.05);
    });
    f.connect(g);
    out(g, send);
  };

  /** Glockenspiel-like bell. */
  const bell = (freq: number, t: number, vol = 0.09, decay = 1.6) => {
    const a = ctx!;
    [1, 2.76, 5.4].forEach((h, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "sine";
      o.frequency.value = freq * h;
      const v = vol * (i === 0 ? 1 : i === 1 ? 0.4 : 0.15);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay / (1 + i));
      o.connect(g);
      out(g, 1.4);
      o.start(t);
      o.stop(t + decay + 0.05);
    });
  };

  /** Woodblock "tok". */
  const tok = (t: number, freq = 900, vol = 0.12) => {
    const a = ctx!;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g);
    out(g, 0.6);
    o.start(t);
    o.stop(t + 0.12);
  };

  /** Soft felt thud. */
  const thud = (t: number, vol = 0.3) => {
    const a = ctx!;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.24);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g);
    out(g, 0.3);
    o.start(t);
    o.stop(t + 0.36);
    const len = Math.floor(a.sampleRate * 0.12);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const n = a.createBufferSource();
    n.buffer = buf;
    const nf = a.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 900;
    const ng = a.createGain();
    ng.gain.value = vol * 0.25;
    n.connect(nf).connect(ng);
    out(ng, 0.2);
    n.start(t);
  };

  /** Pitch glide with vibrato (slide whistle, "wonk", boing). */
  const glide = (f0: number, f1: number, t: number, dur: number, vol = 0.08, type: OscillatorType = "sine", vib = 6) => {
    const a = ctx!;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (vib) {
      const l = a.createOscillator();
      const lg = a.createGain();
      l.frequency.value = vib;
      lg.gain.value = f0 * 0.025;
      l.connect(lg).connect(o.frequency);
      l.start(t);
      l.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    out(g, 0.8);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  /** Low reedy "strain" under the push (very soft). */
  const strain = (t: number, dur: number) => {
    const a = ctx!;
    const o = a.createOscillator();
    const f = a.createBiquadFilter();
    const g = a.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(NOTE(43), t);
    o.frequency.linearRampToValueAtTime(NOTE(45), t + dur);
    f.type = "lowpass";
    f.frequency.value = 520;
    f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.2);
    g.gain.setValueAtTime(0.05, t + dur - 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g);
    out(g, 0.5);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  // Music bed: soft walking pizzicato ostinato, C major, ~120 bpm.
  const BEAT = 60 / 120 / 2;
  const BASS = [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 55, 0, 50, 0];
  const CHORD = [
    [64, 67, 72],
    [64, 67, 72],
    [65, 69, 72],
    [62, 67, 71],
  ];
  const bedNote = (step: number, at: number) => {
    const s16 = step % 16;
    if (BASS[s16]) pluck(NOTE(BASS[s16]), at, 0.1, 0.5, 0.4);
    if (s16 % 4 === 2) CHORD[Math.floor(s16 / 4)].forEach((n, i) => pluck(NOTE(n), at + i * 0.012, 0.032, 0.32, 0.8));
  };
  const startMusic = (at?: number) => {
    if (offline) {
      if (musicFrom < 0) musicFrom = at ?? 0;
      return;
    }
    if (!ctx || musicTimer) return;
    musicStep = 0;
    nextBeat = ctx.currentTime + 0.05;
    musicTimer = setInterval(() => {
      if (!ctx) return;
      while (nextBeat < ctx.currentTime + 0.2) {
        bedNote(musicStep, nextBeat);
        musicStep += 1;
        nextBeat += BEAT;
      }
    }, 50);
  };
  const stopMusic = (at?: number) => {
    if (offline) {
      if (musicFrom >= 0) {
        for (let k = 0, t = musicFrom + 0.05; t < (at ?? musicFrom); k++, t += BEAT) bedNote(k, t);
      }
      musicFrom = -1;
      return;
    }
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  };

  const ready = () => (offline ? true : !!ctx && ctx.state === "running" && !muted);

  return {
    ready,
    async unlock() {
      const a = ensure();
      if (!a) return false;
      try {
        if (a.state !== "running") await (a as AudioContext).resume();
      } catch {
        return false;
      }
      muted = false;
      if (master) master.gain.setValueAtTime(volume, a.currentTime);
      return a.state === "running";
    },
    setMuted(m) {
      muted = m;
      if (!ctx || !master) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(m ? 0.0001 : volume, t + 0.15);
      if (m) stopMusic();
    },
    stop() {
      stopMusic();
      if (master && ctx) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0.0001, t + 0.15);
        master.gain.setValueAtTime(muted ? 0.0001 : volume, t + 0.25);
      }
    },
    cue(name, index = 0) {
      if (!ready()) return;
      this.cueAt(name, ctx!.currentTime + 0.01, index);
    },
    endAt(t) {
      stopMusic(t);
    },
    cueAt(name, t, index = 0) {
      if (!ensure()) return;
      switch (name) {
        case "letter": {
          const scale = [72, 74, 76, 79, 81, 84, 86, 88];
          pluck(NOTE(scale[index % scale.length]), t, 0.09, 0.5);
          break;
        }
        case "enter":
          tok(t, 1100, 0.07);
          tok(t + 0.12, 900, 0.06);
          startMusic(t);
          break;
        case "push":
          strain(t, 1.5);
          break;
        case "land":
          thud(t, 0.32);
          break;
        case "tilt":
          // the "n" slips: a sour little "wonk"; the music stops for the joke
          stopMusic(t);
          pluck(NOTE(70), t, 0.07, 0.6);
          pluck(NOTE(71), t, 0.05, 0.6);
          glide(NOTE(67), NOTE(60), t + 0.03, 0.45, 0.05, "triangle", 9);
          break;
        case "notice":
          pluck(NOTE(67), t, 0.09, 0.35);
          pluck(NOTE(74), t + 0.16, 0.09, 0.5);
          break;
        case "funny":
          glide(1500, 560, t, 0.45, 0.055, "sine", 7);
          break;
        case "scamper":
          for (let i = 0; i < 6; i++) tok(t + i * 0.13, i % 2 ? 820 : 980, 0.05);
          break;
        case "fix":
          tok(t, 1000, 0.1);
          glide(260, 720, t + 0.03, 0.28, 0.06, "sine", 16);
          pluck(NOTE(79), t + 0.12, 0.08, 0.5);
          if (offline) startMusic(t + 0.3);
          else setTimeout(() => startMusic(), 300);
          break;
        case "climb":
          [60, 64, 67, 72, 76].forEach((n, i) => pluck(NOTE(n), t + i * 0.07, 0.075, 0.35));
          break;
        case "sit":
          tok(t, 520, 0.08);
          thud(t, 0.12);
          break;
        case "sting":
          stopMusic(t);
          [48, 60, 64, 67, 72].forEach((n, i) => pluck(NOTE(n), t + i * 0.025, i === 0 ? 0.12 : 0.09, 1.1));
          bell(NOTE(84), t + 0.08, 0.08, 1.8);
          bell(NOTE(88), t + 0.2, 0.06, 1.8);
          bell(NOTE(91), t + 0.32, 0.05, 2.0);
          break;
      }
    },
  };
}

/**
 * Render the intro soundtrack offline (for video export): pass the cue list with times in
 * seconds; returns a stereo AudioBuffer of `duration` seconds.
 */
export async function renderIntroSoundtrack(cues: { name: IntroCue; t: number; i?: number }[], duration: number, sampleRate = 48000) {
  const octx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const s = createIntroSound(0.5, octx);
  [...cues].sort((a, b) => a.t - b.t).forEach((c) => s.cueAt(c.name, c.t, c.i ?? 0));
  s.endAt(duration);
  return octx.startRendering();
}
