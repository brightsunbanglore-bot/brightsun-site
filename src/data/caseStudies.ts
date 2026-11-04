/**
 * Client case studies for the homepage.
 *
 * `fact` and `about` come from each client's own public website (self-reported
 * there, not verified by us). `levers` ("visibility focus") and `query`
 * (the kind of search the brand competes for) are DRAFTS — confirm them with
 * the team before publishing. Add `result` ({ value, label }) per client as
 * soon as real numbers are approved; it renders automatically.
 *
 * Logos: each card tries `/public/clients/<slug>.png|webp|svg` first (drop
 * original files there for best quality), then the remote `logo` URL taken
 * from the client's site, then falls back to the brand name.
 */
export type CaseStudy = {
  slug: string;
  /** Search Console property, e.g. "sc-domain:suprameds.in" (or a URL-prefix property). Defaults to sc-domain of `domain`. */
  gscProperty?: string;
  name: string;
  domain?: string;
  url?: string;
  sector: string;
  about: string;
  fact: string;
  query: string;
  levers: string[];
  logo?: string;
  /** Set to "dark" for white logos: they are shown on a dark chip so they stay visible. */
  logoOn?: "dark";
  result?: { value: string; label: string; source?: { label: string; href: string } };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "upnourish",
    name: "Upnourish",
    domain: "upnourish.com",
    url: "https://www.upnourish.com/",
    sector: "D2C nutrition",
    about: "A direct-to-consumer nutrition brand, later acquired by Pluckk.",
    fact: "Acquired by Pluckk",
    query: "best protein for weight management",
    levers: ["SEO", "Meta Ads", "Email Marketing"],
    logo: "https://www.upnourish.com/cdn/shop/files/logo-upnourish-us.png?v=1777284567&width=260",
    result: {
      value: "$1.4M",
      label: "reported acquisition by Pluckk (2024)",
      source: {
        label: "Entrackr",
        href: "https://entrackr.com/2024/10/pluckk-acquires-nutrition-brand-upnourish-for-1-4-mn/",
      },
    },
  },
  {
    slug: "matrrix",
    name: "Matrrix",
    domain: "matrrix.in",
    url: "https://matrrix.in",
    sector: "Coaching & training",
    about: "Pune-based life coaching, NLP and ICF coach certification and corporate leadership programs.",
    fact: "Coaching since 2005",
    query: "ICF coach certification india",
    levers: ["SEO", "AEO", "Google Ads"],
    logo: "https://matrrix.in/images/logo/logo-new.png",
  },
  {
    slug: "suprameds",
    name: "Suprameds",
    domain: "suprameds.in",
    url: "https://suprameds.in",
    sector: "Online pharmacy",
    about: "A Hyderabad online pharmacy delivering medicines and health products across India.",
    fact: "Delivers across India",
    query: "buy medicines online india",
    levers: ["SEO", "Google Ads", "Conversion Optimization"],
    logo: "https://suprameds.in/assets/logo.png",
  },
  {
    slug: "ekohumm",
    name: "Ekohumm",
    domain: "ekohumm.com",
    url: "https://ekohumm.com",
    sector: "Astrology & Vaastu",
    about: "Online Vedic astrology, numerology, Vaastu and matchmaking consultations from Pune.",
    fact: "1,000+ astrology consultations",
    query: "vedic astrologer online consultation",
    levers: ["Local SEO", "SEO", "Meta Ads"],
    logo: "https://www.ekohumm.com/assets/images/ekohum-main-logo.png",
  },
  {
    slug: "ecodyne",
    name: "Ecodyne Tableware",
    domain: "ecodynetableware.com",
    url: "https://ecodynetableware.com",
    sector: "Eco tableware · export",
    about: "Palm-leaf plates, bowls and tableware made in India and exported worldwide.",
    fact: "Ships to 19 countries",
    query: "palm leaf plates manufacturer exporter",
    levers: ["SEO", "GEO", "Google Ads"],
    logo: "https://ecodynetableware.com/wp-content/uploads/2026/05/ChatGPT-Image-May-1-2026-06_40_37-PM-300x300.png",
  },
  {
    slug: "petnest",
    name: "ThePetNest",
    domain: "thepetnest.com",
    url: "https://thepetnest.com/",
    sector: "Pet care marketplace",
    about: "Book at-home grooming, boarding, walking, training and vet care for pets.",
    fact: "Grooming, boarding, vets & more",
    query: "dog grooming at home near me",
    levers: ["Local SEO", "Meta Ads", "Email Marketing"],
    logo: "https://dm6g3jbka53hp.cloudfront.net/static-images/header__app-upadate-banner__app-logo-v1.png",
  },
  {
    slug: "vrs",
    name: "VRS Enterprises",
    domain: "vrsenterprise.com",
    url: "https://vrsenterprise.com/",
    sector: "Tax & compliance",
    about: "Hyderabad consulting for GST, tax, company registration and loans.",
    fact: "GST, tax & loans under one roof",
    query: "gst registration consultant hyderabad",
    levers: ["Local SEO", "Google Ads", "AEO"],
    logo: "https://vrsenterprise.com/wp-content/uploads/2026/02/cropped-VRS-Enterprises-Logo.png",
  },
  {
    slug: "mykitten",
    name: "MyKitten",
    domain: "mykitten.in",
    url: "https://mykitten.in",
    sector: "Pet marketplace",
    about: "An Indian marketplace connecting buyers with vet-checked kittens from registered home breeders.",
    fact: "9,000+ families listed",
    query: "persian kitten price india",
    levers: ["SEO", "Meta Ads", "Conversion Optimization"],
    logo: "https://mykitten.in/wp-content/uploads/2021/10/ezgif.com-resize-2.webp",
  },
  {
    slug: "srimas",
    name: "SriMas Associate",
    domain: "srimasassociate.com",
    url: "https://srimasassociate.com/",
    sector: "Property & licensing",
    about: "Bengaluru consultants for property registration, Khata transfers and business licences.",
    fact: "Serving clients since 2007",
    query: "khata transfer bangalore",
    levers: ["Local SEO", "AEO", "Google Ads"],
    logo: "https://srimasassociate.com/wp-content/uploads/2024/10/images-removebg-preview.png",
  },
  {
    slug: "qutone",
    name: "Qutone Ceramic",
    domain: "qutoneceramic.com",
    url: "https://www.qutoneceramic.com/",
    sector: "Ceramic tiles",
    about: "Manufacturer of ceramic wall, floor and glazed vitrified tiles for homes and commercial spaces.",
    fact: "Premium tile manufacturer",
    query: "glazed vitrified tiles manufacturer",
    levers: ["SEO", "Technical SEO", "Google Ads"],
    logo: "https://www.qutoneceramic.com/theme/images/Logo/logo.png",
  },
  {
    slug: "staffing",
    name: "Contract Staffing Hub",
    domain: "contractstaffinghub.com",
    url: "https://contractstaffinghub.com",
    sector: "Staffing & payroll",
    about: "Payroll and contract staffing across five Indian cities.",
    fact: "Staff deployed in 24–48 hours",
    query: "contract staffing company india",
    levers: ["SEO", "Google Ads", "Email Marketing"],
    logo: "https://contractstaffinghub.com/wp-content/uploads/2022/11/cropped-fav-removebg-preview-270x270.png",
  },
  {
    slug: "collegedost",
    name: "College Dost",
    domain: "collegedost.com",
    url: "https://collegedost.com/",
    sector: "Education",
    about: "Rank predictors, mock tests and counselling for engineering entrance exams.",
    fact: "Rank predictor used by 50,000+",
    query: "eamcet rank predictor",
    levers: ["SEO", "AEO", "Email Marketing"],
    logo: "https://collegedost.in/wp-content/uploads/2024/03/Group-10266.png",
  },
  {
    slug: "flyingfish",
    name: "FlyingFish Scuba",
    domain: "flyingfish.in",
    url: "https://flyingfish.in",
    sector: "Scuba diving · Goa",
    about: "An SSI-certified scuba diving centre at Novotel Resort & Spa, Candolim, Goa, diving mainly at Grand Island.",
    fact: "SSI-certified dive centre",
    query: "scuba diving in goa",
    levers: ["Local SEO", "Google Ads", "Meta Ads"],
    logo: "https://flyingfish.in/wp-content/uploads/2026/02/flyingfish-scuba-school-logo-transparent.webp",
  },
  {
    slug: "bytepaper",
    name: "Bytepaper",
    domain: "bytepaper.com",
    url: "https://bytepaper.com",
    sector: "WhatsApp sales automation",
    about: "A WhatsApp-based sales platform with a shared team inbox, CRM, broadcasts, chatbots and order management.",
    fact: "Official WhatsApp Business API",
    query: "whatsapp crm for sales teams",
    levers: ["SEO", "GEO", "Google Ads"],
    logo: "https://bytepaper.com/wp-content/uploads/2023/02/BP-logo.png",
  },
  {
    slug: "boxwealth",
    name: "Box Wealth Advisors",
    domain: "boxwealth.in",
    url: "https://boxwealth.in",
    sector: "Investment advisory",
    about: "A SEBI-registered investment advisor in Noida building financial roadmaps for families, professionals and NRIs.",
    fact: "SEBI-registered investment advisor",
    query: "sebi registered investment advisor noida",
    levers: ["Local SEO", "SEO", "Google Ads"],
    logo: "https://boxwealth.in/images/boxpfa-logo-white.png",
    logoOn: "dark",
  },
];

/**
 * DRAFT method copy shown on each card ("how we grow it"). Generated from the
 * client's own details; edit per client once real work is confirmed.
 */
export function howWeGrow(s: CaseStudy) {
  return {
    organic: [
      { t: "Technical audit", d: `Fix crawl, speed and indexing across ${s.domain ?? s.name}.` },
      { t: "Search-led pages", d: `Build pages around real demand such as “${s.query}”.` },
      { t: "Rank & measure", d: "Earn rankings, then track clicks and leads in Search Console." },
    ],
    ai: [
      { t: "Entity & schema", d: `Make ${s.name} unmistakable to AI engines with structured data.` },
      { t: "Answer-ready content", d: `FAQs and answers written to be quoted for “${s.query}”.` },
      { t: "Track citations", d: "Monitor mentions across ChatGPT, Gemini, Perplexity and AI Overviews." },
    ],
  };
}

/**
 * Real Google Search Console figures per client, rendered as an animated
 * "Search performance" panel. Add `series` (daily values) to draw the chart.
 * Clients without an entry show nothing here in production.
 */
export type Gsc = {
  clicks?: number;
  impressions: number;
  ctr?: number; // percent
  position?: number;
  range: string;
  /** Daily series for the dual-line chart (clicks left axis, impressions right axis). */
  series?: { clicks: number[]; impressions: number[]; clicksMax: number; impressionsMax: number; from: string; to: string };
};
export type Metric = { value: number; suffix: string; label: string };
/** Verified public figure taken from the client's own website. */
export type Proof = { value: number; suffix?: string; label: string; dec?: boolean };
export type Metrics = { organic?: Metric; ai?: Metric; gsc?: Gsc; proof?: Proof[] };

export const caseMetrics: Record<string, Metrics> = {
  matrrix: { gsc: { clicks: 1190, impressions: 13700000, ctr: 0, position: 8.4, range: "28 Jul – 24 Oct 2026" } },
  ekohumm: { gsc: { clicks: 1070, impressions: 80600, ctr: 1.3, position: 8.1, range: "28 Jul – 24 Oct 2026" } },
  srimas: { gsc: { clicks: 135, impressions: 7460, ctr: 1.8, position: 18.4, range: "28 Jul – 24 Oct 2026" } },
  ecodyne: { gsc: { clicks: 784, impressions: 33900, ctr: 2.3, position: 27.6, range: "28 Jul – 24 Oct 2026" } },
  staffing: { gsc: { clicks: 714, impressions: 47300, ctr: 1.5, position: 22.4, range: "28 Jul – 24 Oct 2026" } },
  flyingfish: { gsc: { clicks: 714, impressions: 47300, ctr: 1.5, position: 22.4, range: "28 Jul – 24 Oct 2026" } },
  bytepaper: { gsc: { clicks: 5600, impressions: 395000, ctr: 1.4, position: 26.4, range: "28 Jun 2025 – Oct 2026" } },
  boxwealth: { gsc: { clicks: 695, impressions: 7650, ctr: 9.1, position: 9.5, range: "7 Jan – Oct 2026" } },
  qutone: { gsc: { clicks: 3190, impressions: 5700000, ctr: 0, position: 8.4, range: "Google Search Console" } },
  upnourish: { gsc: { clicks: 8260, impressions: 34400000, ctr: 0, position: 8.7, range: "28 Jun 2025 – Oct 2026" } },
  suprameds: { gsc: { clicks: 7450, impressions: 2100000, ctr: 0.4, position: 6.7, range: "28 Jul – 24 Oct 2026" } },
  collegedost: { proof: [{ value: 50000, suffix: "+", label: "students used the rank predictor" }, { value: 3000, suffix: "+", label: "colleges covered" }] },
  mykitten: { proof: [{ value: 9000, suffix: "+", label: "families across India" }] },
  petnest: { proof: [{ value: 98.7, suffix: "%", label: "of reviews are 5-star", dec: true }] },
};

// Default every study's Search Console property to its domain property.
for (const s of caseStudies) if (!s.gscProperty && s.domain) s.gscProperty = `sc-domain:${s.domain.replace(/^www\./, "")}`;
