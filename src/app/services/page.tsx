import type { Metadata } from "next";
import { ServicesExperience } from "@/components/services/ServicesExperience";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI SEO, AEO, GEO, SEO, Local and Technical SEO, Google Ads, Meta Ads, Email Marketing and Conversion Optimization from BrightSun SEO.",
};

export default function ServicesPage() {
  return <ServicesExperience />;
}
