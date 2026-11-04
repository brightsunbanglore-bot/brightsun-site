import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="pb-32 pt-48 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-6xl text-ink">Page not found</h1>
      <Link href="/" className="link-underline mt-8 inline-block">
        Back to home
      </Link>
    </Container>
  );
}
