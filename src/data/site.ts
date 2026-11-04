export type NavItem = {
  label: string;
  href: string;
};

/**
 * Contact details are taken from the live site (brightsunseo.com,
 * header/footer and Return & Refund Policy page). Keep them in sync
 * with the live site if anything changes.
 */
export const siteConfig = {
  name: "Brightsun SEO",
  tagline: "Illuminating your path to online success",
  description:
    "Brightsun SEO is a creative digital agency in Bengaluru offering SEO, SEM, social media marketing and branding.",
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Our Work", href: "/work" },
    { label: "Blogs", href: "/blogs" },
    { label: "Contact", href: "/contact" },
  ] satisfies NavItem[],
  contact: {
    phoneDisplay: "+91 87928 85105",
    phoneHref: "tel:+918792885105",
    whatsappHref: "https://wa.me/918792885105",
    addressLines: [
      "699, 1st floor, Naidu Layout, Shantipura",
      "Electronic City Phase II",
      "Bengaluru, Karnataka 560100",
    ],
  },
};
