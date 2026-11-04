import { siteConfig } from "@/data/site";
import { Container } from "./Container";
import { HeaderShell } from "./HeaderShell";
import { MainNav } from "@/components/navigation/MainNav";
import { MobileNav } from "@/components/navigation/MobileNav";
import { HeaderLogo } from "@/components/brand/HeaderLogo";
import { Button } from "@/components/ui/Button";

export function SiteHeader() {
  return (
    <HeaderShell>
      <Container className="flex h-18 items-center justify-between gap-6 md:h-22">
        <HeaderLogo />
        <MainNav items={siteConfig.nav} />
        <div className="hidden md:block">
          <Button href="/contact" size="sm">
            Let&apos;s Grow
          </Button>
        </div>
        <MobileNav items={siteConfig.nav} />
      </Container>
    </HeaderShell>
  );
}
