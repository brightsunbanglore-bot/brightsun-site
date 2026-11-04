// Services page content. Titles and one-liners follow the homepage services (homeServices);
// the "what you get" lists are new copy — review before launch. No numbers or claims.

export type ServiceVisual =
  | "ai"
  | "aeo"
  | "geo"
  | "seo"
  | "local"
  | "tech"
  | "gads"
  | "meta"
  | "email"
  | "cro";

export type ServiceChapter = {
  id: string;
  group: string;
  title: string;
  kicker: string;
  description: string;
  bullets: string[];
  visual: ServiceVisual;
  /** Sunny's silent act for this service (see SERVICE_ACTS). */
  cue: string;
  /** Section tint. */
  tint: string;
};

export const servicesHero = {
  eyebrow: "Services",
  titleTop: "Ten ways to make",
  titleAccent: "your brand shine.",
  intro:
    "Search, AI answers, ads and inboxes: we put your brand where your customers are already looking, and keep it there.",
  ticker: ["Found on Google", "Cited by AI", "Clicked on ads", "Opened in inboxes", "Chosen by customers"],
};

export const serviceChapters: ServiceChapter[] = [
  {
    id: "ai-seo",
    group: "AI Search",
    title: "AI SEO",
    kicker: "SEO for the AI era",
    description:
      "Research, content and technical work sped up with AI tools and checked by our specialists, so you move faster without losing quality.",
    bullets: ["AI-assisted keyword research", "Content briefs checked by humans", "Faster technical audits"],
    visual: "ai",
    cue: "svc-ai",
    tint: "#FFFDF7",
  },
  {
    id: "aeo",
    group: "AI Search",
    title: "Answer Engine Optimisation",
    kicker: "AEO",
    description:
      "Clear, well-structured answers so featured snippets and voice assistants can pick your content when people ask a question.",
    bullets: ["Question-led content", "FAQ and how-to structure", "Schema markup"],
    visual: "aeo",
    cue: "svc-aeo",
    tint: "#FFF6E3",
  },
  {
    id: "geo",
    group: "AI Search",
    title: "Generative Engine Optimisation",
    kicker: "GEO",
    description:
      "Help your brand get mentioned and cited in AI answers from tools like ChatGPT, Gemini and Perplexity.",
    bullets: ["Brand and entity clarity", "Citable, trustworthy pages", "Mentions across the web"],
    visual: "geo",
    cue: "svc-geo",
    tint: "#FFFDF7",
  },
  {
    id: "seo",
    group: "Search",
    title: "Search Engine Optimization",
    kicker: "SEO",
    description:
      "Get more website traffic, more customers, and more online visibility with powerful and precise SEO services.",
    bullets: ["Keyword strategy", "On-page optimisation", "Quality link building"],
    visual: "seo",
    cue: "svc-seo",
    tint: "#FFF6E3",
  },
  {
    id: "local-seo",
    group: "Search",
    title: "Local SEO",
    kicker: "Near me, found",
    description: "Show up in local searches and on Google Maps with a well-managed Business Profile and local pages.",
    bullets: ["Google Business Profile", "Local landing pages", "Reviews and citations"],
    visual: "local",
    cue: "svc-local",
    tint: "#FFFDF7",
  },
  {
    id: "technical-seo",
    group: "Search",
    title: "Technical SEO",
    kicker: "Under the bonnet",
    description: "Site speed, crawlability, structured data and clean architecture that search engines can read.",
    bullets: ["Speed and Core Web Vitals", "Crawl and index fixes", "Structured data"],
    visual: "tech",
    cue: "svc-tech",
    tint: "#FFF6E3",
  },
  {
    id: "google-ads",
    group: "Paid",
    title: "Google Ads",
    kicker: "Top of the page, today",
    description: "Search, Shopping, Display and YouTube campaigns aimed at the searches that matter to your business.",
    bullets: ["Search and Shopping", "Display and YouTube", "Conversion tracking"],
    visual: "gads",
    cue: "svc-gads",
    tint: "#FFFDF7",
  },
  {
    id: "meta-ads",
    group: "Paid",
    title: "Meta Ads",
    kicker: "Where they scroll",
    description: "Facebook and Instagram campaigns that reach the right audience and bring them back with retargeting.",
    bullets: ["Audience targeting", "Scroll-stopping creatives", "Retargeting"],
    visual: "meta",
    cue: "svc-meta",
    tint: "#FFF6E3",
  },
  {
    id: "email",
    group: "Owned",
    title: "Email Marketing",
    kicker: "Still works. Really.",
    description: "Newsletters and automated email journeys that turn subscribers into repeat customers.",
    bullets: ["Newsletters", "Automated journeys", "List growth"],
    visual: "email",
    cue: "svc-email",
    tint: "#FFFDF7",
  },
  {
    id: "cro",
    group: "Owned",
    title: "Conversion Optimization",
    kicker: "Visitors into customers",
    description: "Turn your casual visitors into paying customers.",
    bullets: ["Landing page testing", "Clearer calls to action", "Fewer drop-offs"],
    visual: "cro",
    cue: "svc-cro",
    tint: "#FFF6E3",
  },
];

export const processSteps = [
  { title: "Listen", text: "We learn your business, your customers and what success looks like for you." },
  { title: "Plan", text: "A clear strategy across search, AI answers, ads and email, in plain language." },
  { title: "Build", text: "Our specialists do the work: content, technical fixes, campaigns and journeys." },
  { title: "Grow", text: "Regular reports, honest conversations, and constant tuning as results come in." },
];
