"use client";

import clsxBase from "clsx";
import { twMerge } from "tailwind-merge";

/** clsx + tailwind-merge so caller classes (e.g. w-auto) override component defaults (w-full). */
const clsx = (...a: Parameters<typeof clsxBase>) => twMerge(clsxBase(...a));
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { X, Check, Loader2, MessageCircle, Camera, Phone, Inbox } from "lucide-react";

/* ───────── Button ───────── */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "invert";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
  loading?: boolean;
  href?: string;
  icon?: ReactNode;
};
const btnBase = "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
const btnVariants: Record<string, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover shadow-[0_8px_24px_-10px_var(--brand)]",
  secondary: "bg-raised text-ink hover:bg-line-strong border border-line",
  outline: "border border-line-strong text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink-2 hover:text-ink hover:bg-line",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white",
  invert: "bg-invert text-invert-ink hover:opacity-90",
};
const btnSizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-[15px]" };

export function Button({ variant = "secondary", size = "md", pill, loading, href, icon, className, children, ...rest }: BtnProps) {
  const cls = clsx(btnBase, btnVariants[variant], btnSizes[size], pill ? "rounded-full" : "rounded-lg", className);
  const inner = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </>
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return (
    <button {...rest} disabled={rest.disabled || loading} className={cls}>
      {inner}
    </button>
  );
}

/* ───────── Badge ───────── */
const tones = {
  neutral: "bg-line text-ink-2",
  brand: "bg-brand-soft text-brand",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
};
export type Tone = keyof typeof tones;
export function Badge({ tone = "neutral", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  Connected: "success", Healthy: "success", Active: "success", Approved: "success", Paid: "success", Delivered: "success", Resolved: "success", Indexed: "success", Published: "success", Synced: "success", "Synced to AI": "success", Verified: "success", Completed: "success", Done: "success",
  Pending: "warning", "In review": "warning", Scheduled: "info", Trial: "info", Interested: "info", New: "info", Invited: "warning", Processing: "info", Open: "warning", "In progress": "info", Packed: "info", Shipped: "info", Confirmed: "brand", Normal: "neutral", Draft: "neutral", Due: "warning", "At risk": "warning", "Follow up": "warning", "Needs human": "warning", "AI handling": "brand",
  Rejected: "danger", Cancelled: "danger", Error: "danger", Suspended: "danger", "Needs reconnect": "danger", Expired: "danger", High: "danger", Failed: "danger", "Not submitted": "neutral",
};
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={statusTone[status] ?? "neutral"} dot>{status}</Badge>;

/* ───────── Surfaces ───────── */
export function Card({ className, children, hover, ...rest }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div {...rest} className={clsx("rounded-xl border border-line bg-surface", hover && "transition-colors hover:border-line-strong", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] md:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, delta, hint, accent, icon, good }: { label: string; value: ReactNode; delta?: string; hint?: string; accent?: boolean; icon?: ReactNode; good?: boolean }) {
  const up = good ?? delta?.startsWith("+");
  return (
    <div className={clsx("relative overflow-hidden rounded-xl border p-5", accent ? "border-brand-line bg-brand text-white" : "border-line bg-surface")}>
      <div className="flex items-center justify-between">
        <span className={clsx("text-[13px] font-medium", accent ? "text-white/80" : "text-ink-3")}>{label}</span>
        {icon && <span className={clsx("grid size-8 place-items-center rounded-lg", accent ? "bg-white/15" : "bg-raised text-ink-2")}>{icon}</span>}
      </div>
      <div className="num mt-3 text-[30px] font-bold leading-none tracking-[-0.03em]">{value}</div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta && <span className={clsx("font-semibold", accent ? "text-white" : up ? "text-success" : "text-danger")}>{delta}</span>}
        {hint && <span className={accent ? "text-white/70" : "text-ink-3"}>{hint}</span>}
      </div>
    </div>
  );
}

/* ───────── Form ───────── */
const fieldCls = "w-full rounded-lg border border-line-strong bg-bg-deep/60 px-3.5 text-sm text-ink placeholder:text-ink-4 transition-colors hover:border-ink-4 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-50";

export function Field({ label, hint, error, children, className }: { label?: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>}
      {children}
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-ink-3">{hint}</span> : null}
    </label>
  );
}
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={clsx(fieldCls, "h-10", className)} />;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={clsx(fieldCls, "min-h-24 py-2.5 leading-relaxed", className)} />;
}
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={clsx(fieldCls, "select-chevron h-10 appearance-none pr-9", className)}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-brand" : "bg-line-strong")}
    >
      <span className={clsx("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
      <span className="relative mt-0.5 grid size-4 shrink-0 place-items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer absolute inset-0 size-4 cursor-pointer appearance-none rounded border border-line-strong bg-bg-deep/60 transition-colors checked:border-brand checked:bg-brand" />
        <Check className="pointer-events-none relative size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3.5} />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-bg-deep/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx("inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", value === o.value ? "bg-raised text-ink shadow-sm" : "text-ink-3 hover:text-ink")}
        >
          {o.label}
          {o.count != null && <span className="num rounded-full bg-line px-1.5 text-[11px] text-ink-2">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ───────── Overlays ───────── */
function useOverlay(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? []);
    (focusables()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose, ref]);
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useOverlay(open, onClose, ref);
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className={clsx("relative flex max-h-[90vh] w-full animate-pop flex-col rounded-2xl border border-line-strong bg-surface shadow-pop", w)}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id={id} className="text-lg font-semibold tracking-tight">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-ink"><X className="size-4" /></button>
        </div>
        <div className="scroll-y px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useOverlay(open, onClose, ref);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[85]">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className={clsx("absolute right-0 top-0 flex h-full w-full animate-slide-in flex-col border-l border-line-strong bg-surface shadow-pop", width)}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id={id} className="text-lg font-semibold tracking-tight">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-ink"><X className="size-4" /></button>
        </div>
        <div className="scroll-y flex-1 px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

/* ───────── Feedback ───────── */
export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-raised text-ink-3">{icon ?? <Inbox className="size-5" />}</div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-3">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-line", className)} />;
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "success" | "warning" | "danger" }) {
  const c = { brand: "bg-brand", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-all duration-500", c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, colour, size = 36 }: { name: string; colour?: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-black/70" style={{ width: size, height: size, background: colour || "#e0e1ed", fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

/* Generic channel chips — never real platform logos */
const chan = {
  Facebook: { Icon: MessageCircle, cls: "bg-[#3b6cf6]/15 text-[#6e93ff]" },
  Instagram: { Icon: Camera, cls: "bg-[#d6409f]/15 text-[#f074c4]" },
  WhatsApp: { Icon: Phone, cls: "bg-[#25a55a]/15 text-[#3ccf91]" },
} as const;
export function ChannelChip({ type, compact }: { type: string; compact?: boolean }) {
  const c = chan[type as keyof typeof chan] ?? chan.Facebook;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-md text-xs font-medium", c.cls, compact ? "p-1.5" : "px-2 py-1")}>
      <c.Icon className="size-3.5" />
      {!compact && type}
    </span>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children, className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th {...p} className={clsx("whitespace-nowrap border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-3", className)}>{children}</th>
);
export const Td = ({ children, className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...p} className={clsx("border-b border-line px-5 py-3.5 align-middle text-ink-2", className)}>{children}</td>
);

export function SectionTitle({ eyebrow, title, text, center, className }: { eyebrow?: string; title: ReactNode; text?: ReactNode; center?: boolean; className?: string }) {
  return (
    <div className={clsx(center && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && <div className={clsx("eyebrow mb-5", center && "justify-center")}>{eyebrow}</div>}
      <h2 className="text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl lg:text-[56px]">{title}</h2>
      {text && <p className="mt-5 text-lg leading-relaxed text-ink-2">{text}</p>}
    </div>
  );
}
