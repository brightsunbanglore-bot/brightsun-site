import type { Metadata } from "next";
import { ContactExperience } from "@/components/contact/ContactExperience";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell BrightSun about your business. Message us, WhatsApp us, call us or visit us in Bengaluru.",
};

export default function ContactPage() {
  return <ContactExperience />;
}
