"use client";

import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button, Modal, Switch, Select } from "@/components/ui";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";

/** Floating demo scenario controls (ported from UI.demoControls). */
export function DemoControls({ admin }: { admin?: boolean }) {
  const { toast, confirm } = useUI();
  const demo = useStore<any>("demo", {});
  const [open, setOpen] = useState(false);
  const set = (k: string, v: any) => store.set(`demo.${k}`, v);

  const reset = async () => {
    if (await confirm({ title: "Reset demo data?", message: "All local edits and setup progress will be replaced by fictional seeds. You will be signed out.", danger: true, confirmLabel: "Reset" })) {
      store.reset();
      toast("Demo data restored.", "success");
      window.location.href = "/login";
    }
  };

  const rows: [string, string, React.ReactNode][] = [
    ["Live incoming messages", "A customer message arrives in the Inbox about every 20 seconds.", <Switch key="a" checked={!!demo.live} onChange={(v) => set("live", v)} label="Live incoming messages" />],
    ["Simulate token expiry", "Facebook shows OAuth error 190 and needs re-authorising.", <Switch key="b" checked={!!demo.tokenExpired} onChange={(v) => set("tokenExpired", v)} label="Simulate token expiry" />],
    ["WhatsApp reply window expired", "Composer is replaced by an approved-template flow.", <Switch key="c" checked={!!demo.windowExpired} onChange={(v) => set("windowExpired", v)} label="WhatsApp reply window expired" />],
    ["Simulate failed payment", "The next billing action fails until you turn this off.", <Switch key="d" checked={!!demo.paymentFailed} onChange={(v) => set("paymentFailed", v)} label="Simulate failed payment" />],
  ];

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 hidden items-center gap-2 rounded-full border border-line-strong bg-raised/95 px-4 py-2.5 text-[13px] font-medium shadow-pop backdrop-blur transition-colors hover:border-brand hover:text-brand lg:inline-flex" style={{ left: "auto", right: "1.25rem", bottom: "1.25rem" }}>
        <SlidersHorizontal className="size-4" /> Demo controls
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Demo controls" footer={<><Button variant="danger" icon={<RotateCcw className="size-4" />} onClick={reset} className="mr-auto">Reset demo data</Button><Button variant="primary" onClick={() => setOpen(false)}>Done</Button></>}>
        <p className="mb-5 text-sm text-ink-2">Flip scenarios to demonstrate recovery flows. Nothing here changes a real account.</p>
        <div className="divide-y divide-line">
          {rows.map(([t, d, ctl]) => <div key={t} className="flex items-center justify-between gap-6 py-4"><div><div className="text-sm font-medium">{t}</div><div className="text-[13px] text-ink-3">{d}</div></div>{ctl}</div>)}
          <div className="flex items-center justify-between gap-6 py-4"><div><div className="text-sm font-medium">Connection scenario</div><div className="text-[13px] text-ink-3">The next channel connection will fail with this reason.</div></div>
            <Select className="w-44" value={demo.connectionError || "none"} onChange={(e) => set("connectionError", e.target.value)} aria-label="Connection scenario"><option value="none">Works normally</option><option value="permission">Permission denied</option><option value="role">Missing Page role</option></Select></div>
        </div>
      </Modal>
    </>
  );
}
