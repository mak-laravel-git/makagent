"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";

export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q}>
            <button
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-tight transition-colors hover:text-brand md:text-xl"
            >
              {q}
              <span className={clsx("grid size-9 shrink-0 place-items-center rounded-full border border-line-strong transition-all", isOpen && "rotate-45 border-brand bg-brand text-white")}>
                <Plus className="size-4" />
              </span>
            </button>
            <div className={clsx("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]")}>
              <p className="overflow-hidden pr-14 text-base leading-relaxed text-ink-2">{a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const generalFaq: [string, string][] = [
  ["Do I need technical knowledge to get started?", "Not at all. Connect your business channels, add your products, teach the agent your policies, and try a few conversations. The guided setup walks you through every step."],
  ["Can the agent reply in Bangla and Banglish?", "Yes. The agent answers in Bangla, Banglish or English from your product catalog, matching the way each customer writes."],
  ["What happens when a customer needs a real person?", "The agent pauses when a customer asks for a human, an unknown question needs help, or an escalation rule applies. Your team takes over with the full conversation history intact."],
  ["Can I use my existing business accounts?", "Yes — MakAgent is designed to connect the Facebook Pages, Instagram accounts and WhatsApp numbers you already manage."],
  ["Is this connected to Meta or a live AI service?", "This preview runs entirely in your browser with simulated connections, messages and billing, so you can explore every workflow safely. Please don’t enter real credentials or sensitive information."],
];
