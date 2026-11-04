import type { Metadata } from "next";
import { AboutExperience } from "@/components/about/AboutExperience";

export const metadata: Metadata = {
  title: "About",
  description: "A journey of business and beyond: the story of BrightSun and the two people behind it.",
};

export default function AboutPage() {
  return <AboutExperience />;
}
