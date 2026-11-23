"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { store } from "@/lib/store";
import { Button, Modal } from "@/components/ui";

type ToastType = "success" | "error" | "info" | "warning";
type ToastItem = { id: number; message: string; type: ToastType };
type ConfirmOpts = { title: string; message?: string; danger?: boolean; confirmLabel?: string };

type UICtx = {
  toast: (message: string, type?: ToastType) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  theme: "dark" | "light";
  toggleTheme: () => void;
};

const Ctx = createContext<UICtx | null>(null);
export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI must be used inside <Providers>");
  return c;
};

const toastIcon = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const toastTone = { success: "text-success", error: "text-danger", info: "text-info", warning: "text-warning" };

export function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    store.hydrate();
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve })),
    [],
  );

  const toggleTheme = useCallback(() => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("sp-theme", next); } catch {}
      return next;
    });
  }, []);

  const value = useMemo(() => ({ toast, confirm, theme, toggleTheme }), [toast, confirm, theme, toggleTheme]);
  const close = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = toastIcon[t.type];
          return (
            <div key={t.id} className="pointer-events-auto flex animate-pop items-start gap-3 rounded-lg border border-line-strong bg-raised/95 px-4 py-3 text-sm shadow-pop backdrop-blur">
              <Icon className={`mt-0.5 size-4 shrink-0 ${toastTone[t.type]}`} />
              <span className="flex-1 leading-snug text-ink">{t.message}</span>
              <button aria-label="Dismiss" className="text-ink-3 hover:text-ink" onClick={() => setToasts((x) => x.filter((i) => i.id !== t.id))}>
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
      <Modal
        open={!!confirmState}
        onClose={() => close(false)}
        title={confirmState?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {confirmState?.confirmLabel ?? (confirmState?.danger ? "Delete" : "Confirm")}
            </Button>
          </>
        }
      >
        {confirmState?.message && <p className="text-sm leading-relaxed text-ink-2">{confirmState.message}</p>}
      </Modal>
    </Ctx.Provider>
  );
}
