import { AppShell } from "@/components/app/shell";
import { ConnectProvider } from "@/components/app/connect";
import { DemoControls } from "@/components/app/demo-controls";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="client">
      <ConnectProvider>{children}</ConnectProvider>
      <DemoControls />
    </AppShell>
  );
}
