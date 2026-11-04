// Saves a CLEAN homepage screenshot of every client to public/clients/<slug>-home.png
// No installs needed: it drives your own Google Chrome (or Edge/Chromium) over the DevTools protocol.
// It dismisses cookie/consent banners, removes popups, overlays, chat bubbles, ad frames and
// preloaders, then captures the page exactly as a visitor would see it.
//
//   node scripts/capture-homepages.mjs            (all clients)
//   node scripts/capture-homepages.mjs matrrix    (one client)
//
// Needs Node 22+ (built-in WebSocket) and an internet connection.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SITES = {
  matrrix: "https://matrrix.in",
  suprameds: "https://suprameds.in",
  ekohumm: "https://ekohumm.com",
  ecodyne: "https://ecodynetableware.com",
  petnest: "https://thepetnest.com/",
  vrs: "https://vrsenterprise.com/",
  mykitten: "https://mykitten.in",
  srimas: "https://srimasassociate.com/",
  qutone: "https://www.qutoneceramic.com/",
  staffing: "https://contractstaffinghub.com",
  collegedost: "https://collegedost.com/",
  boxwealth: "https://boxwealth.in",
  bytepaper: "https://bytepaper.com",
  flyingfish: "https://flyingfish.in",
  upnourish: "https://www.upnourish.com/",
};

const CHROMES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const chrome = CHROMES.find(existsSync);
if (!chrome) { console.error("Chrome/Edge/Chromium not found."); process.exit(1); }
if (typeof WebSocket === "undefined") { console.error("Needs Node 22+ (global WebSocket)."); process.exit(1); }

const only = process.argv.slice(2);
const targets = Object.entries(SITES).filter(([k]) => !only.length || only.includes(k));
mkdirSync("public/clients", { recursive: true });

const PORT = 9333;
const proc = spawn(chrome, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "cap-"))}`,
  "--headless=new", "--hide-scrollbars", "--no-first-run", "--disable-notifications",
  "--disable-popup-blocking=false", "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 40 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); } }
if (!version) { proc.kill(); console.error("Could not start the browser."); process.exit(1); }

// Runs inside the page: click "accept/close" buttons, then delete popups & overlays.
const CLEAN = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const label = /^(accept( all)?|agree|i agree|allow( all)?|got it|ok(ay)?|continue|no,? thanks?|not now|maybe later|dismiss|close|skip|reject( all)?|decline|×|✕|x)$/i;
  document.querySelectorAll('button,a,[role=button],div[class*=close],span[class*=close]').forEach((b) => {
    const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
    if (t && t.length < 18 && label.test(t)) { try { b.click(); } catch {} }
  });
  const bad = /(popup|pop-up|modal|cookie|consent|gdpr|newsletter|subscribe|chat|whatsapp|intercom|tawk|crisp|drift|hubspot|livechat|overlay|backdrop|preload|loader|spinner|adsbygoogle|advert|banner-ad|sticky-ad|notification)/i;
  const kill = (el) => el && el.remove();
  document.querySelectorAll('ins.adsbygoogle,iframe[src*="doubleclick"],iframe[src*="googlesyndication"],iframe[id*="google_ads"],[id^="google_ads"],[class*="adsbygoogle"]').forEach(kill);
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    const id = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '');
    const r = el.getBoundingClientRect();
    const fixed = cs.position === 'fixed';
    const big = r.width * r.height > vw * vh * 0.35;
    const pos = cs.position === 'fixed' || cs.position === 'absolute' || cs.position === 'sticky';
    if (fixed && el.tagName !== 'HEADER' && el.tagName !== 'NAV' && !el.closest('header,nav')) {
      if (big || bad.test(id) || r.top > vh * 0.55 || (r.width < 140 && r.height < 140 && r.left > vw * 0.6)) return kill(el);
    }
    if (pos && bad.test(id) && /(popup|modal|cookie|consent|overlay|backdrop|preload|loader|newsletter)/i.test(id) && (big || fixed)) return kill(el);
    if (el.tagName === 'DIALOG') return kill(el);
  });
  document.documentElement.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.classList.remove('modal-open', 'no-scroll', 'overflow-hidden');
  scrollTo(0, 0);
})()`;

for (const [slug, url] of targets) {
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); let loaded = () => {};
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } if (d.method === "Page.loadEventFired") loaded(); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  try {
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    const done = new Promise((r) => (loaded = r));
    await send("Page.navigate", { url });
    await Promise.race([done, sleep(30000)]);
    await sleep(4000); // let popups appear, then remove them
    for (let pass = 0; pass < 3; pass++) { await send("Runtime.evaluate", { expression: CLEAN }); await sleep(1500); }
    await send("Runtime.evaluate", { expression: "document.fonts && document.fonts.ready" , awaitPromise: true });
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`public/clients/${slug}-home.png`, Buffer.from(shot.result.data, "base64"));
    console.log("saved", slug);
  } catch (e) { console.log("FAILED", slug, e.message); }
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`).catch(() => {});
}
proc.kill();
console.log("Done. Review each public/clients/*-home.png before publishing.");
