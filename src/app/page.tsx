import { HeroSection } from "@/components/home/HeroSection";
import { IntroScene } from "@/components/home/scenes/IntroScene";
import { ServicesScene } from "@/components/home/scenes/ServicesScene";
import { SeoJourney } from "@/components/home/scenes/SeoJourney";
import { WorkScene } from "@/components/home/scenes/WorkScene";
import { FinaleScene } from "@/components/home/scenes/FinaleScene";
import { SunnyCompanion } from "@/components/mascot/SunnyCompanion";

/**
 * Homepage: a character-led scroll story. Sections are ordinary, accessible
 * content; each marks itself as a scene (`data-sun-scene`) and offers Sunny
 * a spot. One persistent Sunny (SunnyCompanion) travels through them.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <IntroScene />
      <ServicesScene />
      <SeoJourney />
      <WorkScene />
      <FinaleScene />
      <SunnyCompanion />
    </>
  );
}
