"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/app/shell";
import { DemoControls } from "@/components/app/demo-controls";
import { ensureAdminData } from "@/lib/admin";
import { store, useStore } from "@/lib/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = useStore<string | null>("session.role", null);
  useEffect(() => { if (role === "admin") ensureAdminData(); }, [role]);
  const ready = useStore<any>("admin.invoices", null);
  void store;
  return (
    <AppShell role="admin">
      {ready ? children : null}
      <DemoControls admin />
    </AppShell>
  );
}
