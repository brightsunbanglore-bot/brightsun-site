import { caseMetrics, caseStudies, type CaseStudy } from "./caseStudies";

/**
 * Our Work page copy. The hero line is final copy; the per-client story blocks
 * (challenge / what we did) are DRAFTS generated from each client's own details
 * (sector, search focus, services). They make no numeric claims: replace them
 * with the real story per client. The "result" block shows real Search Console
 * figures from caseMetrics when they exist and stays neutral otherwise.
 */
export const workHero = {
  eyebrow: "Our Work",
  titleTop: "Brands we have",
  titleAccent: "helped shine.",
  intro: "A selection from 100+ brands across many sectors, one aim: be the name customers find first, on Google and in AI answers.",
};

export type WorkStory = {
  challenge: string;
  did: string;
  result: { kind: "gsc"; clicks?: number; impressions: number; range: string } | { kind: "proof"; items: { value: number; suffix?: string; label: string; dec?: boolean }[] } | { kind: "none" };
};

const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export function workStory(s: CaseStudy): WorkStory {
  const m = caseMetrics[s.slug];
  const result: WorkStory["result"] = m?.gsc
    ? { kind: "gsc", clicks: m.gsc.clicks, impressions: m.gsc.impressions, range: m.gsc.range }
    : m?.proof
      ? { kind: "proof", items: m.proof }
      : { kind: "none" };
  return {
    challenge: `${s.name} needed to be found by people searching for things like “${s.query}”, ahead of the competition.`,
    did: `We worked on ${list(s.levers)}, so ${s.name} shows up where its customers look.`,
    result,
  };
}

export const workStats = () => ({
  clients: caseStudies.length,
  sectors: new Set(caseStudies.map((c) => c.sector)).size,
  services: new Set(caseStudies.flatMap((c) => c.levers)).size,
});

/** Sunny's silent reaction for each panel, cycled. */
export const WORK_CUES = ["wk-applaud", "wk-slip", "wk-trophy", "wk-doubletake", "wk-bow", "wk-dizzy", "wk-thumbs", "wk-sneeze", "wk-flex", "wk-snooze", "wk-groove"] as const;
