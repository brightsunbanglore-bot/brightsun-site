/**
 * Timing of Sunny's journey voice. The gestures in `journeyShow` and the "Our Approach" card
 * were authored against the first recording ("old" seconds); the voice was re-recorded with a
 * different example search, so every time is mapped through these anchors (old second → second
 * in the current journey.mp3). Anchors are the starts of phrases after a pause.
 */
const ANCHORS: [number, number][] = [
  [0, 0],
  [3.84, 4.35],
  [5.64, 6.37],
  [8.36, 8.67],
  [9.43, 9.92],
  [11.2, 11.48],
  [12.67, 13.09],
  [13.68, 14.02],
  [16.94, 17.56],
  [19.41, 20.12],
  [20.76, 21.23],
  [21.81, 22.22],
  [25.28, 25.91],
  [26.42, 27.04],
  [33.18, 33.79],
  [43.61, 44.58],
  [50.47, 51.33],
  [51.11, 54.08],
  [52.43, 55.07],
];

/** old authoring time → time in the current recording */
export function warpT(t: number): number {
  const a = ANCHORS;
  if (t <= 0) return t;
  for (let i = 1; i < a.length; i++) {
    if (t <= a[i][0]) {
      const [o0, n0] = a[i - 1];
      const [o1, n1] = a[i];
      return n0 + ((t - o0) / (o1 - o0)) * (n1 - n0);
    }
  }
  const [oL, nL] = a[a.length - 1];
  return nL + (t - oL);
}

/** time in the current recording → old authoring time */
export function unwarpT(t: number): number {
  const a = ANCHORS;
  if (t <= 0) return t;
  for (let i = 1; i < a.length; i++) {
    if (t <= a[i][1]) {
      const [o0, n0] = a[i - 1];
      const [o1, n1] = a[i];
      return o0 + ((t - n0) / (n1 - n0)) * (o1 - o0);
    }
  }
  const [oL, nL] = a[a.length - 1];
  return oL + (t - nL);
}
