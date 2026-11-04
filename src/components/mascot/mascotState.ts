/**
 * Shared, mutable mascot state. Written by DOM listeners / GSAP, read by
 * the character — so pointer, scroll and pokes never cause React re-renders.
 */
export const mascotState = {
  /** Pointer relative to the stage, -1 … 1. */
  pointerX: 0,
  pointerY: 0,
  /** After the intro the cursor is parked on its button: ignore it until the mouse really moves again. */
  pointerFrozen: false,
  /** Viewport position just above Sunny's head (px), updated while he is on screen; -1 = unknown. */
  headX: -1,
  headY: -1,
  /** Viewport position just above the tips of his top rays (px); -1 = unknown. */
  topX: -1,
  topY: -1,
  /** Cursor is over the stage. */
  hover: false,
  /** 0 → 1 as the hero scrolls away. */
  scroll: 0,
  /** Incremented on every click / tap / Enter on the stage. */
  pokes: 0,
  /** Review helper: act to play first after the entrance (from ?sunny=…). */
  firstAct: "" as string,

  // ---- Scroll journey (homepage companion) ---------------------------------
  /** "hero" = full-size in the hero, "mini" = floating companion. */
  mode: "hero" as "hero" | "mini",
  /** Latest scene cue (an act name) and a counter so repeats are detected. */
  cue: "" as string,
  cueId: 0,
  /** Visitor asked for calmer Sunny: no surprises, no idle tricks. */
  calm: false,
  /** Visitor muted Sunny: no sound at all; he keeps a finger on his lips and does quiet, silly things. */
  muted: false,
  /** Set by an act to make the companion hop to another spot (spot name). */
  hopTo: "" as string,
  hopId: 0,
  /** Set by a scene to move the companion to another spot (glide, no arc). */
  goTo: "" as string,
  goId: 0,
};

/** Ask Sunny to play a named act (the character's director decides when). */
export function cueSunny(name: string) {
  mascotState.cue = name;
  mascotState.cueId += 1;
  cueListeners.forEach((l) => l(name));
}

/** Fire a one-off event (e.g. "rollin", "arrive") to the audio layer without playing an act. */
export function sunnyEvent(name: string) {
  cueListeners.forEach((l) => l(name));
}

/** Observers of cues (the audio layer plays a matching sound). */
export const cueListeners = new Set<(name: string) => void>();

/** Ask the companion dock to glide to a named spot. */
export function goSunny(spot: string) {
  mascotState.goTo = spot;
  mascotState.goId += 1;
}

/** Ask the companion dock to hop (with an arc) to a named spot. */
export function hopSunny(spot: string) {
  mascotState.hopTo = spot;
  mascotState.hopId += 1;
}
