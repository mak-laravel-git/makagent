"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, PageHeader, Switch, Table, Td, Th } from "@/components/ui";
import { ReasonModal } from "@/components/app/reason-modal";
import { audit } from "@/lib/admin";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";

const FLAGS: [string, string, string][] = [["scheduler", "Post scheduler", "Lets clients schedule posts."], ["comments", "Comment automation", "Rule-based replies to public comments."], ["advancedAnalytics", "Advanced analytics", "Funnel and sentiment charts."]];

export default function AdminSettings() {
  const router = useRouter();
  const { toast } = useUI();
  const settings = useStore<any>("admin.settings", { maintenance: false, featureFlags: {} });
  const users = useStore<any[]>("admin.users", []);
  const [reset, setReset] = useState(false);
  const [typed, setTyped] = useState("");

  const set = (patch: any, label: string) => { store.update<any>("admin.settings", (s) => Object.assign(s, patch)); audit("Platform setting changed", "", label); toast("Setting saved.", "success"); };

  return (
    <>
      <PageHeader eyebrow="Operations · Admin" title="Platform settings" description="Feature flags, maintenance mode, admin accounts and data controls." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader title="Maintenance" />
          <label className="flex items-center justify-between gap-6 p-5"><span><strong className="font-medium">Maintenance notice</strong><span className="block text-sm text-ink-3">Shows a non-blocking banner to clients. Does not take the product offline.</span></span><Switch checked={!!settings.maintenance} label="Maintenance notice" onChange={(v) => set({ maintenance: v }, `Maintenance ${v ? "on" : "off"}`)} /></label></Card>
        <Card><CardHeader title="Feature flags" />
          <div className="divide-y divide-line">{FLAGS.map(([k, t, d]) => <label key={k} className="flex items-center justify-between gap-6 p-5"><span><strong className="font-medium">{t}</strong><span className="block text-sm text-ink-3">{d}</span></span><Switch checked={settings.featureFlags?.[k] !== false} label={t} onChange={(v) => set({ featureFlags: { ...settings.featureFlags, [k]: v } }, `${t} ${v ? "enabled" : "disabled"}`)} /></label>)}</div></Card>
      </div>
      <Card className="mt-6"><CardHeader title="Admin accounts" description="Two-factor status is a UI specification here." />
        <Table><thead><tr><Th>Name</Th><Th>Role</Th><Th>Two-factor</Th></tr></thead><tbody>{users.map((u) => <tr key={u.id}><Td className="font-medium text-ink">{u.name}</Td><Td>{u.role}</Td><Td>{u.twoFactor ? <Badge tone="success"><ShieldCheck className="size-3" /> Enabled</Badge> : <Badge tone="warning"><ShieldOff className="size-3" /> Not enabled</Badge>}</Td></tr>)}</tbody></Table></Card>
      <Card className="mt-6 border-danger/30"><CardHeader title={<span className="text-danger">Data & reset</span>} description="Clears every additive workspace, setting, invoice and audit addition and signs you out." /><div className="p-5"><Button variant="danger" onClick={() => { setTyped(""); setReset(true); }}>Reset all demo data…</Button></div></Card>
      <ReasonModal open={reset} onClose={() => setReset(false)} title="Reset all demo data" danger confirmLabel="Reset everything" onConfirm={() => { if (typed !== "RESET") { toast("Type RESET to confirm.", "warning"); return false; } store.reset(); router.push("/login"); }}>
        <p className="text-sm text-ink-2">Type <strong className="text-ink">RESET</strong> and give a reason to confirm.</p><Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type RESET" />
      </ReasonModal>
    </>
  );
}
