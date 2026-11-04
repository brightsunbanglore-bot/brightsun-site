"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { cueSunny } from "@/components/mascot/mascotState";
import { siteConfig } from "@/data/site";

const SERVICES = ["SEO", "AI Search", "Google Ads", "Meta Ads", "Email Marketing", "Website"];
const BUDGETS = ["Under ₹25k", "₹25k – ₹75k", "₹75k +", "Not sure yet"];

type Errors = Partial<Record<"name" | "phone" | "email" | "form", string>>;

const inputCls =
  "peer h-12 w-full rounded-xl border border-espresso/15 bg-ivory px-3.5 pb-1 pt-5 text-[0.92rem] text-espresso outline-none transition placeholder-transparent focus:border-flame focus:bg-white focus:ring-4 focus:ring-sun/40";
const labelCls =
  "pointer-events-none absolute left-3.5 top-3 origin-left text-[0.88rem] text-espresso/55 transition-all duration-200 peer-focus:top-1.5 peer-focus:text-[0.64rem] peer-focus:font-semibold peer-focus:text-flame peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[0.64rem]";

function Field({ error, children }: { label?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <div className="relative">{children}</div>
      {error && <p className="mt-1.5 px-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

/** Contact form: friendly floating labels, tap-to-select chips, validation, success screen. */
export function ContactForm({ className = "" }: { className?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const toggle = (s: string) => setServices((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (name.trim().length < 2) err.name = "Please tell us your name.";
    if (phone.replace(/\D/g, "").length < 10) err.phone = "Enter a phone / WhatsApp number (10 digits).";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) err.email = "That email doesn't look right.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setState("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, services, budget, message, company }),
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) throw new Error(data.error || "failed");
      setState("done");
      cueSunny("celebrate"); // Sunny cheers
    } catch (ex) {
      setErrors({ form: ex instanceof Error && ex.message !== "failed" ? ex.message : "Something went wrong. Please try again, or message us on WhatsApp." });
      setState("idle");
    }
  };

  const waText = encodeURIComponent(
    `Hi BrightSun! I'm ${name || "…"}. ${services.length ? `I'm interested in ${services.join(", ")}. ` : ""}${message}`.trim(),
  );

  if (state === "done") {
    return (
      <div className={`rounded-[2rem] bg-white p-8 text-center shadow-[0_30px_80px_-30px_rgba(35,27,24,0.45)] md:p-12 ${className}`} role="status">
        <span aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun text-3xl text-espresso">
          ✓
        </span>
        <h3 className="mt-6 font-hero text-3xl font-extrabold tracking-[-0.03em] text-espresso md:text-4xl">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}! 🎉
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-espresso/70">We got your message and we&apos;ll get back to you shortly. Sunny is already celebrating.</p>
        <a
          href={`${siteConfig.contact.whatsappHref}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-espresso px-7 text-sm font-semibold text-ivory transition hover:-translate-y-0.5"
        >
          Want a faster reply? Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={`relative rounded-3xl bg-white p-5 shadow-[0_24px_60px_-28px_rgba(35,27,24,0.45)] md:p-6 ${className}`}
      aria-label="Contact form"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-hero text-xl font-extrabold tracking-[-0.03em] text-espresso md:text-2xl">Tell us about your project</h3>
        <p className="hidden text-xs text-espresso/55 sm:block">Under a minute · No spam</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field error={errors.name}>
          <input id="cf-name" name="name" autoComplete="name" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} className={inputCls} aria-invalid={!!errors.name} />
          <label htmlFor="cf-name" className={labelCls}>
            Your name *
          </label>
        </Field>
        <Field error={errors.phone}>
          <input id="cf-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder=" " value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} aria-invalid={!!errors.phone} />
          <label htmlFor="cf-phone" className={labelCls}>
            Phone / WhatsApp *
          </label>
        </Field>
        <Field error={errors.email}>
          <input id="cf-email" name="email" type="email" autoComplete="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} aria-invalid={!!errors.email} />
          <label htmlFor="cf-email" className={labelCls}>
            Email (optional)
          </label>
        </Field>
        <div className="relative">
          <select
            id="cf-budget"
            name="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-espresso/15 bg-ivory px-3.5 pt-3 text-[0.92rem] text-espresso outline-none transition focus:border-flame focus:bg-white focus:ring-4 focus:ring-sun/40"
          >
            <option value="">Not sure yet</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <label htmlFor="cf-budget" className="pointer-events-none absolute left-3.5 top-1.5 text-[0.64rem] font-semibold text-espresso/55">
            Monthly budget
          </label>
          <span aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-espresso/50">
            ▾
          </span>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="sr-only">What do you need help with?</legend>
        <div className="flex flex-wrap gap-1.5">
          {SERVICES.map((s) => {
            const on = services.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  on ? "border-espresso bg-espresso text-ivory" : "border-espresso/15 bg-ivory text-espresso hover:border-flame hover:bg-sun/25"
                }`}
              >
                {on ? "✓ " : ""}
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="relative mt-4">
        <textarea id="cf-msg" name="message" rows={2} placeholder=" " value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputCls} h-[4.5rem] resize-none pt-6`} />
        <label htmlFor="cf-msg" className={labelCls}>
          Tell us a little about your business
        </label>
      </div>

      {/* honeypot: hidden from people, bots fill it */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errors.form}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "sending"}
          className="group/btn inline-flex h-12 items-center gap-3 rounded-full bg-espresso pl-6 pr-1.5 text-[0.95rem] font-semibold text-ivory transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-14px_rgba(35,27,24,0.7)] active:scale-[0.97] disabled:opacity-70"
        >
          {state === "sending" ? "Sending…" : "Send message"}
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-sun text-espresso transition-transform duration-300 group-hover/btn:translate-x-0.5">
            {state === "sending" ? "…" : "→"}
          </span>
        </button>
        <a
          href={`${siteConfig.contact.whatsappHref}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-espresso underline decoration-flame decoration-2 underline-offset-4 hover:text-flame"
        >
          or chat on WhatsApp
        </a>
      </div>
    </form>
  );
}
