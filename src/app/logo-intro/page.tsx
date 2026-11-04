import type { Metadata } from "next";
import { LogoIntroPreview } from "@/components/brand/LogoIntroPreview";

// Review page for the BrightSun logo intro. Not part of the site navigation; kept out of search.
export const metadata: Metadata = {
  title: "BrightSun logo intro (review)",
  robots: { index: false, follow: false },
};

export default function LogoIntroPage() {
  return <LogoIntroPreview />;
}
