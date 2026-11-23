"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, MailCheck, Sparkles, CircleCheck } from "lucide-react";
import { Button, Field, Input, Checkbox } from "@/components/ui";
import { Brand } from "./brand";
import { store, uid } from "@/lib/store";
import { SEED } from "@/lib/data";
import { useUI } from "@/components/providers";

type Mode = "login" | "signup" | "forgot";

const copy = {
  login: { h1: "Welcome back. Your next sale is waiting.", title: "Good to see you again.", sub: "Sign in to your workspace or explore a demo role." },
  signup: { h1: "A little setup. A lot more possibility.", title: "Start your next chapter.", sub: "Create your workspace. Your 14-day trial starts here." },
  forgot: { h1: "A fresh start is one step away.", title: "Forgot your password?", sub: "Enter your email for a simulated recovery request." },
};

export function AuthPage({ mode }: { mode: Mode }) {
  return (
    <Suspense>
      <AuthInner mode={mode} />
    </Suspense>
  );
}

function AuthInner({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useUI();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const c = copy[mode];
  const suspended = params.get("blocked") === "suspended";

  const go = (role: "client" | "admin") => {
    store.login(role);
    router.push(role === "admin" ? "/admin/overview" : store.get("onboarding.completed") ? "/app/overview" : "/onboarding");
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const business = String(f.get("business") || "").trim();
    const phone = String(f.get("phone") || "").replace(/[\s-]/g, "");
    const pw = String(f.get("password") || "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (mode === "forgot") { setDone(email); toast("Simulated recovery request completed.", "info"); return; }
    if (!pw) return setError("Enter a password (any demo password works).");
    if (mode === "signup") {
      if (business.length < 2) return setError("Enter your business name.");
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) return setError("Enter an 11-digit Bangladesh mobile number, e.g. 01712345678.");
      if (pw.length < 8) return setError("Use at least 8 characters for the password.");
      if (!terms) return setError("Please accept the Terms and Privacy Policy to continue.");
      store.reset();
      store.login("client", email);
      store.update<any>("client", (c) => Object.assign(c, { name: business, owner: "Workspace owner", email, phone, plan: "Free Trial", website: "", address: "", agentLive: false }));
      store.set("team", [{ id: uid(), name: "Workspace owner", email, role: "Owner", status: "Active" }]);
      for (const k of ["products", "faqs", "documents", "knowledge", "orders", "leads", "conversations", "messages", "posts", "templates", "invoices", "notifications"]) store.set(k, []);
      store.set("offers", []);
      store.set("commentRules", []);
      store.set("channels", SEED.channels.map((ch) => ({ ...ch, status: "Not connected", webhook: false, bot: false, tokenHealth: "Not authorised" })));
      store.set("agent.greeting", `হ্যালো! আমি Nila, ${business}-এর AI shopping assistant। কীভাবে সাহায্য করতে পারি?`);
      store.set("onboarding", { step: 1, completed: false, profile: { name: business, phone, category: "Fashion & accessories", language: "auto", website: "", areas: "", hours: "" }, rules: {}, knowledge: [], selectedPlan: params.get("plan") || "trial" });
      router.push("/onboarding");
      return;
    }
    store.login("client", email);
    router.push(store.get("onboarding.completed") ? "/app/overview" : "/onboarding");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* story panel */}
      <section className="surface-deep relative hidden flex-col justify-between overflow-hidden p-14 lg:flex xl:p-20">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute -left-32 top-1/3 size-[520px] rounded-full bg-brand/10 blur-[110px]" />
        <Brand className="relative" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-brand"><Sparkles className="size-4" /> Your best salesperson, in every inbox</span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-[-0.04em] xl:text-6xl">{c.h1}</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">More helpful conversations. Fewer missed customers. Build an AI sales agent that feels like part of your team.</p>
          <ul className="mt-9 space-y-3.5">
            {["Made for Bangla, Banglish and English", "Your products. Your voice. Your rules.", "Facebook, Instagram and WhatsApp together"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-ink"><CircleCheck className="size-5 text-brand" />{t}</li>
            ))}
          </ul>
        </div>
        <figure className="relative max-w-lg rounded-2xl border border-line bg-surface/70 p-6 backdrop-blur">
          <div className="text-brand">★★★★★</div>
          <blockquote className="mt-3 text-lg leading-snug">“Now every price question gets an answer — even on our busiest days.”</blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-raised text-sm font-bold">NJ</span>
            <div className="leading-tight"><div className="text-sm font-semibold">Nusrat Jahan</div><div className="text-xs text-ink-3">Dhaka Threads · Illustrative demo persona</div></div>
          </figcaption>
        </figure>
      </section>

      {/* form */}
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <div className="mb-10 flex items-center justify-between lg:justify-end">
          <Brand className="lg:hidden" />
          <Link href="/" className="text-sm text-ink-3 hover:text-ink">← Back to site</Link>
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center pb-10">
          {done ? (
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand"><MailCheck className="size-7" /></span>
              <h2 className="mt-6 text-2xl font-bold tracking-tight">Recovery preview is ready.</h2>
              <p className="mt-3 text-ink-2">A production service would send a time-limited link to <strong className="text-ink">{done}</strong>. No email has been sent.</p>
              <Button href="/login" variant="primary" pill size="lg" className="mt-8">Back to login <ArrowRight className="size-4" /></Button>
            </div>
          ) : (
            <>
              <h2 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">{c.title}</h2>
              <p className="mt-2 text-ink-2">{c.sub}</p>
              {suspended && <div role="alert" className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">This demo workspace is suspended. An administrator can reactivate it in Clients.</div>}
              {error && <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-3.5 text-sm text-danger">{error}</div>}
              <form onSubmit={submit} noValidate className="mt-8 space-y-5">
                {mode === "signup" && <Field label="Business name"><Input name="business" placeholder="e.g. Dhaka Threads" autoComplete="organization" /></Field>}
                <Field label="Email address"><Input name="email" type="email" placeholder="you@yourbusiness.com" autoComplete="email" /></Field>
                {mode === "signup" && <Field label="Phone number"><Input name="phone" type="tel" placeholder="01712345678" autoComplete="tel" /></Field>}
                {mode !== "forgot" && (
                  <Field label="Password" hint={mode === "signup" ? "Demo only. Never use a real password here." : undefined}>
                    <div className="relative">
                      <Input name="password" type={showPw ? "text" : "password"} placeholder={mode === "signup" ? "At least 8 characters" : "Enter any demo password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="pr-11" />
                      <button type="button" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw((s) => !s)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md text-ink-3 hover:text-ink">
                        {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </Field>
                )}
                {mode === "signup" && (
                  <Checkbox checked={terms} onChange={setTerms} label={<>I agree to the <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>, including the AI processing disclosure.</>} />
                )}
                {mode === "login" && (
                  <div className="flex items-center justify-between text-sm"><span className="text-ink-3">Any demo credentials work.</span><Link href="/forgot-password" className="text-brand hover:underline">Forgot password?</Link></div>
                )}
                <Button type="submit" variant="primary" size="lg" pill className="w-full">
                  {mode === "forgot" ? "Preview recovery request" : mode === "signup" ? "Create my workspace" : "Sign in"} <ArrowRight className="size-4" />
                </Button>
              </form>

              {mode === "login" && (
                <>
                  <div className="my-8 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4"><span className="h-px flex-1 bg-line" />Or explore without signing in<span className="h-px flex-1 bg-line" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" pill onClick={() => go("client")}>Enter as Client</Button>
                    <Button variant="outline" pill onClick={() => go("admin")}>Enter as Admin</Button>
                  </div>
                </>
              )}
              <p className="mt-8 text-center text-sm text-ink-3">
                {mode === "forgot" ? <Link href="/login" className="text-brand hover:underline">← Back to login</Link> : mode === "signup" ? <>Already have a workspace? <Link href="/login" className="font-medium text-brand hover:underline">Log in</Link></> : <>New here? <Link href="/signup" className="font-medium text-brand hover:underline">Start your free trial</Link></>}
              </p>
              <p className="mt-8 rounded-lg border border-line bg-surface p-3.5 text-xs leading-relaxed text-ink-3">Interactive preview only. Details stay in this browser — no real account, email, external login or payment.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
