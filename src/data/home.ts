/**
 * Homepage copy. Everything here is taken from the live brightsunseo.com
 * site (home + About pages). Only light grammar fixes were made — no new
 * claims, numbers, clients or testimonials. Source page noted per block.
 */

// Approved headline (CLAUDE_CODE_PROMPT.txt). Supporting copy describes the
// services listed on brightsunseo.com; CTA wording follows the live site's
// "Get Free Consultation".
export const hero = {
  eyebrow: "Digital marketing agency · Bengaluru",
  titleLines: [["Let's", "Make"], ["Your", "Brand"], ["Shine", "Online"]],
  accentLine: 1,
  intro:
    "SEO, pay-per-click advertising, social media marketing and branding from a creative digital team in Bengaluru.",
  primaryCta: { label: "Get a Free Consultation", href: "/contact" },
  secondaryCta: { label: "Our Services", href: "/services" },
  // Outcomes named in the live site's SEO service description — labels, not metrics.
  highlights: ["Higher Rankings", "More Visibility", "More Customers"],
};

// Home page "SEO" block on brightsunseo.com
export const seoStory = {
  eyebrow: "Our approach",
  titleLines: ["SEO That Brings", "More Visibility"],
  body: "Get more website traffic, more customers, and more online visibility with powerful and precise SEO services.",
};

// About page
export const introduction = {
  statement:
    "We're passionate about guiding businesses towards the sunlight of online visibility.",
  paragraphs: [
    "We are a team of experienced digital marketing experts dedicated to empowering brands to reach their target audience, drive qualified leads, and ultimately achieve their growth objectives.",
    "We don't just offer services; we build partnerships with our clients, taking the time to understand their unique needs and crafting customised strategies to help them shine brighter online.",
  ],
  // Home page: "Brightsun SEO is the pioneering digital strategy company" process
  approach: ["Research", "Optimization", "User Friendly", "Cross Links"],
};

// Home page services block. NOTE: on the live site the descriptions for
// "Digital Branding" and "Conversion Optimization" appear to be swapped;
// they are matched to the right service here.
export const services = [
  {
    title: "Search Engine Optimization",
    short: "SEO",
    description:
      "Get more website traffic, more customers, and more online visibility with powerful and precise SEO services.",
  },
  {
    title: "Pay Per Click Advertising",
    short: "PPC",
    description:
      "Target your ideal search phrases and get found at the top of Google's search results.",
  },
  {
    title: "Social Media Marketing",
    short: "SMM",
    description:
      "Create and manage top-performing social campaigns and start developing a dedicated customer fan base.",
  },
  {
    title: "Content Marketing",
    short: "Content",
    description:
      "Create, publish, and promote engaging content to generate more traffic and build a dedicated community.",
  },
  {
    title: "Digital Branding",
    short: "Brand",
    description:
      "Your brand is a powerful marketing tool that can drive sales and ensure that customers always think of you first.",
  },
  {
    title: "Conversion Optimization",
    short: "CRO",
    description: "Turn your casual visitors into paying customers.",
  },
];

// Live site "Branding" menu
export const brandingServices = ["Logo Designing", "Print Design", "Package Design", "Style Scapes"];

// Home page contact block heading + About page values line
export const contactCta = {
  title: "Let's discuss your project.",
  body: "We believe in building long-term relationships with our clients, and that starts with honesty and transparency.",
};

// Homepage services focus (new copy requested by the client, Oct 2026 — not
// from the live site; review before launch). Search in the AI era first,
// then paid media and owned channels.
export const homeServices = [
  {
    title: "AI SEO",
    description: "SEO for the AI era: research, content and technical work sped up with AI tools and checked by our specialists.",
  },
  {
    title: "Answer Engine Optimisation (AEO)",
    description: "Clear, well-structured answers so featured snippets and voice assistants can pick your content.",
  },
  {
    title: "Generative Engine Optimisation (GEO)",
    description: "Help your brand get mentioned and cited in AI answers from tools like ChatGPT, Gemini and Perplexity.",
  },
  {
    title: "Search Engine Optimization",
    description:
      "Get more website traffic, more customers, and more online visibility with powerful and precise SEO services.",
  },
  {
    title: "Local SEO",
    description: "Show up in local searches and on Google Maps with a well-managed Business Profile and local pages.",
  },
  {
    title: "Technical SEO",
    description: "Site speed, crawlability, structured data and clean architecture that search engines can read.",
  },
  {
    title: "Google Ads",
    description: "Search, Shopping, Display and YouTube campaigns aimed at the searches that matter to your business.",
  },
  {
    title: "Meta Ads",
    description: "Facebook and Instagram campaigns that reach the right audience and bring them back with retargeting.",
  },
  {
    title: "Email Marketing",
    description: "Newsletters and automated email journeys that turn subscribers into repeat customers.",
  },
  {
    title: "Conversion Optimization",
    description: "Turn your casual visitors into paying customers.",
  },
];

// Homepage "Our work" scene: the channels we focus on (no case studies yet).
export const focusChannels = ["AI search: SEO, AEO & GEO", "Google Ads", "Meta Ads", "Email Marketing"];
