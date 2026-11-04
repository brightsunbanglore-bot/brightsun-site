// Turns Google Search Console exports into the case-study charts.
//
// For each client: Search Console -> Performance -> set date range (e.g. last 3 months)
// -> Export -> "Download CSV". From the zip, take "Dates.csv" and save it as
//   data/gsc/<slug>.csv      (slugs: upnourish matrrix suprameds ekohumm ecodyne petnest vrs
//                              mykitten srimas qutone staffing collegedost boxwealth bytepaper flyingfish)
// then run:  node scripts/import-gsc.mjs
// It writes src/data/gsc.generated.json, which the homepage reads. Re-run to refresh.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const out = {};
for (const f of readdirSync("data/gsc").filter((n) => n.endsWith(".csv"))) {
  const slug = f.replace(/\.csv$/, "");
  const [head, ...lines] = readFileSync(`data/gsc/${f}`, "utf8").trim().split(/\r?\n/);
  const cols = head.split(",").map((c) => c.trim().toLowerCase());
  const ix = (n) => cols.findIndex((c) => c.includes(n));
  const [d, c, i, p] = [ix("date"), ix("click"), ix("impression"), ix("position")];
  const rows = lines.map((l) => l.split(",")).map((r) => ({ date: r[d], clicks: +r[c], impressions: +r[i], position: p >= 0 ? +r[p] : 0 }))
    .filter((r) => r.date && !Number.isNaN(r.clicks)).sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) { console.log("skip", slug); continue; }
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const position = impressions ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : 0;
  out[slug] = {
    from: rows[0].date, to: rows.at(-1).date,
    clicks: rows.map((r) => r.clicks), impressions: rows.map((r) => r.impressions),
    totals: { clicks, impressions, ctr: impressions ? (clicks / impressions) * 100 : 0, position },
  };
  console.log("ok", slug, rows.length, "days");
}
writeFileSync("src/data/gsc.generated.json", JSON.stringify(out));
