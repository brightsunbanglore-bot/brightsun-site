import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";
import { SmoothScrollProvider } from "@/components/animations/SmoothScrollProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HomeIntro } from "@/components/home/HomeIntro";
import { NavSound } from "@/components/navigation/NavSound";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const heroFont = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://brightsunseo.com";
const INDEXING = process.env.ALLOW_INDEXING === "true"; // set at build time when ready to go public

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // Keep the in-progress build out of search engines until launch.
  robots: INDEXING ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport = {
  themeColor: "#FFFDF7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* if this is a refresh / back / in-site load, hide the cover straight away so there is no flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var n=performance.getEntriesByType("navigation")[0];if((n&&(n.type==="reload"||n.type==="back_forward"))||(document.referrer&&new URL(document.referrer).origin===location.origin))document.documentElement.setAttribute("data-intro-seen","1")}catch(e){}` }} />
        <style dangerouslySetInnerHTML={{ __html: `html[data-intro-seen] [data-intro-cover]{display:none!important}` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${heroFont.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-espresso focus:px-4 focus:py-2 focus:text-ivory"
        >
          Skip to content
        </a>
        <HomeIntro />
        <NavSound />
        <SmoothScrollProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main" className="relative z-0 flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
