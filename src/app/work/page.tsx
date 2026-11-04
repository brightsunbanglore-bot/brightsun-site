import type { Metadata } from "next";
import { WorkExperience } from "@/components/work/WorkExperience";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Brands we have helped get found on Google and in AI answers.",
};

export default function OurWorkPage() {
  return <WorkExperience />;
}
