import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[80vh] bg-cream/60 pb-20 pt-28 md:pt-32">{children}</div>;
}
