"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import clsx from "clsx";
import { Brand } from "./brand";
import { Button } from "@/components/ui";
import { useUI } from "@/components/providers";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const path = usePathname();
  const { theme, toggleTheme } = useUI();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className={clsx("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled || open ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="container-x flex h-[76px] items-center justify-between gap-6">
        <Brand />
        <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-line bg-surface/70 p-1 backdrop-blur md:flex">
          {links.map((l) => {
            const active = l.href === path;
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={clsx("rounded-full px-4 py-2 text-sm font-medium transition-colors", active ? "bg-raised text-ink" : "text-ink-2 hover:text-ink")}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={toggleTheme} aria-label="Toggle theme" className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-line hover:text-ink">
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <Link href="/login" className="px-3 text-sm font-medium text-ink-2 transition-colors hover:text-ink">Log in</Link>
          <Button href="/signup" variant="primary" pill icon={undefined}>
            Start free trial <ArrowRight className="size-4" />
          </Button>
        </div>
        <button className="grid size-10 place-items-center rounded-full border border-line md:hidden" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="container-x animate-fade-in pb-6 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-3 text-lg font-medium hover:bg-line">{l.label}</Link>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Button href="/login" variant="outline" pill className="flex-1">Log in</Button>
            <Button href="/signup" variant="primary" pill className="flex-1">Start free</Button>
          </div>
        </div>
      )}
    </header>
  );
}
