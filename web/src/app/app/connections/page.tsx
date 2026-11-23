"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink, KeyRound, LogIn, LogOut, RefreshCw, ServerOff, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, Modal, PageHeader, Skeleton, StatusBadge } from "@/components/ui";
import { useUI } from "@/components/providers";

type Provider = { id: string; name: string; description: string; method: "oauth" | "credential"; configured: boolean; missing: string[]; callback?: string; docs?: string };
type Conn = { id: string; provider: string; name: string; kind: string; status: string; last_verified?: number; expires_at?: number | null; error_code?: string | null };
type Acct = { provider: string; external_id: string; name: string; kind: string };

const errors: Record<string, string> = { session_expired: "Your backend session expired. Sign in and try again.", invalid_state: "The authorization session was invalid or expired. Start again.", permission_denied: "Permission was declined at the provider.", no_accounts: "No eligible accounts were found for that authorization.", invalid_code: "The provider returned an invalid code." };

async function api<T = any>(path: string, opts: RequestInit & { csrf?: string } = {}): Promise<T> {
  const { csrf, ...init } = opts;
  const res = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Token": csrf } : {}), ...(init.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body?.detail?.message || body?.message || `Request failed (${res.status})`), { status: res.status });
  return body;
}

export default function ConnectionsPage() {
  return <Suspense><Connections /></Suspense>;
}

function Connections() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [state, setState] = useState<"loading" | "offline" | "anon" | "ready">("loading");
  const [csrf, setCsrf] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [conns, setConns] = useState<Conn[]>([]);
  const [manual, setManual] = useState<Provider | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [flow, setFlow] = useState<string | null>(params.get("flow"));
  const [pending, setPending] = useState<Acct[]>([]);
  const [pick, setPick] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const cerr = params.get("connection_error");

  const load = useCallback(async () => {
    try {
      await api("/api/health");
    } catch { setState("offline"); return; }
    try {
      const s = await api<{ user: any; csrf: string }>("/api/auth/session");
      if (!s.user) { setState("anon"); return; }
      setCsrf(s.csrf);
      const [p, c] = await Promise.all([api("/api/providers"), api("/api/connections")]);
      setProviders(p.providers); setConns(c.connections); setState("ready");
    } catch { setState("anon"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!flow || state !== "ready") return;
    api<{ accounts: Acct[] }>(`/api/pending/${flow}`).then((r) => { setPending(r.accounts); setPick(r.accounts.map((a) => a.external_id)); }).catch((e) => { toast(e.message, "error"); setFlow(null); });
  }, [flow, state, toast]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("login");
    try { await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pw }) }); setPw(""); await load(); } catch (er: any) { toast(er.message, "error"); } finally { setBusy(null); }
  };
  const logout = async () => { await api("/api/auth/logout", { method: "POST", csrf }).catch(() => {}); setState("anon"); setConns([]); };
  const startOauth = async (p: Provider) => { setBusy(p.id); try { const r = await api<{ authorization_url: string }>(`/api/oauth/${p.id}/start`, { method: "POST", csrf }); window.location.href = r.authorization_url; } catch (er: any) { toast(er.message, "error"); setBusy(null); } };
  const saveManual = async () => { if (!manual) return; setBusy(manual.id); try { await api(`/api/connections/${manual.id}/credential`, { method: "POST", csrf, body: JSON.stringify(fields) }); toast(`${manual.name} verified and saved (encrypted).`, "success"); setManual(null); setFields({}); load(); } catch (er: any) { toast(er.message, "error"); } finally { setBusy(null); } };
  const complete = async () => { if (!flow) return; try { await api("/api/connections/complete", { method: "POST", csrf, body: JSON.stringify({ flow, accounts: pick }) }); toast("Accounts connected.", "success"); setFlow(null); setPending([]); router.replace("/app/connections"); load(); } catch (er: any) { toast(er.message, "error"); } };
  const verify = async (c: Conn) => { setBusy(c.id); try { await api(`/api/connections/${c.id}/verify`, { method: "POST", csrf }); toast("Connection verified.", "success"); } catch (er: any) { toast(er.message, "error"); } finally { setBusy(null); load(); } };
  const remove = async (c: Conn) => { if (!(await confirm({ title: `Remove ${c.name}?`, message: "Encrypted local credentials are deleted. Revoke the app or token at the provider separately if required.", danger: true, confirmLabel: "Remove" }))) return; try { await api(`/api/connections/${c.id}`, { method: "DELETE", csrf }); toast("Local credentials removed.", "success"); load(); } catch (er: any) { toast(er.message, "error"); } };

  const manualFields: Record<string, [string, string, string][]> = {
    telegram: [["token", "Bot token", "password"], ["chat_id", "Channel or group chat ID", "text"]],
    discord: [["webhook_url", "Webhook URL", "password"]],
    wordpress: [["site_url", "Site URL (https)", "text"], ["username", "Username", "text"], ["application_password", "Application Password", "password"]],
    whatsapp: [["token", "System-user token", "password"]],
  };

  return (
    <>
      <PageHeader eyebrow="Real hub" title="Real connections" description="Server-authenticated, encrypted-at-rest links to your actual provider accounts." actions={<Button href="/app/channels" variant="ghost">← Channels</Button>} />

      {cerr && <div role="alert" className="mb-6 flex gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"><CircleAlert className="size-5 shrink-0" />{errors[cerr] || `Connection failed: ${cerr}`}</div>}

      {state === "loading" && <Skeleton className="h-64" />}

      {state === "offline" && (
        <Card><EmptyState icon={<ServerOff className="size-5" />} title="The connections backend isn’t running" text="This hub needs the Python service. It never fakes a connection — start it and refresh." action={<div className="max-w-lg rounded-xl border border-line bg-bg-deep/60 p-4 text-left font-mono text-[12.5px] leading-relaxed text-ink-2">python3 -m pip install -r backend/requirements.txt<br />python3 -m backend.manage create-owner --email you@example.com<br />python3 -m uvicorn backend.app:create_app --factory --port 8082</div>} />
          <p className="border-t border-line px-6 py-4 text-center text-xs text-ink-3">Next.js proxies <code>/api/*</code> to <code>BACKEND_URL</code> (default http://localhost:8082). See INTEGRATIONS.md for deployment.</p></Card>
      )}

      {state === "anon" && (
        <Card className="mx-auto max-w-md"><CardHeader title="Sign in to the connections service" description="This is the real owner account created with backend.manage — not the demo login." />
          <form onSubmit={login} className="space-y-4 p-6"><Field label="Owner email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></Field><Field label="Passphrase"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></Field><Button type="submit" variant="primary" className="w-full" loading={busy === "login"} icon={<LogIn className="size-4" />}>Sign in</Button></form></Card>
      )}

      {state === "ready" && (
        <>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-3.5 text-sm"><span className="flex items-center gap-2 text-ink-2"><ShieldCheck className="size-4 text-success" /> Signed in to the connections service</span><Button size="sm" variant="ghost" icon={<LogOut className="size-4" />} onClick={logout}>Sign out</Button></div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2"><h3 className="font-semibold tracking-tight">{p.name}</h3><Badge tone={p.configured ? "success" : "warning"}>{p.configured ? "Configured" : "Setup required"}</Badge></div>
                <p className="mt-2 text-sm text-ink-3">{p.description}</p>
                {!p.configured && <p className="mt-3 text-xs text-warning">Missing: {p.missing.join(", ")}</p>}
                <div className="mt-auto flex items-center gap-2 pt-5">
                  <Button size="sm" variant="primary" disabled={!p.configured} loading={busy === p.id} icon={p.method === "oauth" ? <ExternalLink className="size-3.5" /> : <KeyRound className="size-3.5" />} onClick={() => (p.method === "oauth" ? startOauth(p) : (setFields({}), setManual(p)))}>{p.method === "oauth" ? "Authorize" : "Add credentials"}</Button>
                  {p.docs && <a href={p.docs} target="_blank" rel="noreferrer" className="text-xs text-ink-3 hover:text-brand">Provider docs ↗</a>}
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-8"><CardHeader title="Connected accounts" description="Credentials are sealed with your server’s encryption key and never reach this browser." />
            {conns.length === 0 ? <EmptyState title="No accounts connected yet" text="Authorize a provider above to link your first real account." /> : conns.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0">
                <div><div className="font-medium">{c.name}</div><div className="text-xs text-ink-3">{c.provider} · {c.kind}{c.last_verified ? ` · verified ${new Date(c.last_verified * 1000).toLocaleString()}` : ""}</div>{c.error_code && <div className="mt-1 text-xs text-danger">{c.error_code}</div>}</div>
                <div className="flex items-center gap-2"><StatusBadge status={c.status === "connected" ? "Connected" : c.status === "expired" ? "Expired" : "Needs reconnect"} /><Button size="sm" loading={busy === c.id} icon={<RefreshCw className="size-3.5" />} onClick={() => verify(c)}>Verify</Button><button aria-label={`Remove ${c.name}`} onClick={() => remove(c)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger"><Trash2 className="size-4" /></button></div>
              </div>
            ))}
          </Card>
        </>
      )}

      <Modal open={!!manual} onClose={() => setManual(null)} title={manual ? `Connect ${manual.name}` : ""} footer={<><Button variant="ghost" onClick={() => setManual(null)}>Cancel</Button><Button variant="primary" loading={!!busy} onClick={saveManual}>Verify & save</Button></>}>
        <div className="space-y-4">{(manual ? manualFields[manual.id] || [] : []).map(([k, l, t]) => <Field key={k} label={l}><Input type={t} autoComplete="off" value={fields[k] || ""} onChange={(e) => setFields({ ...fields, [k]: e.target.value })} /></Field>)}<p className="text-xs text-ink-3">Credentials are verified against the provider, then stored encrypted on your server.</p></div>
      </Modal>
      <Modal open={!!flow && pending.length > 0} onClose={async () => { await api(`/api/pending/${flow}`, { method: "DELETE", csrf }).catch(() => {}); setFlow(null); setPending([]); router.replace("/app/connections"); }} title="Choose accounts to connect" footer={<Button variant="primary" disabled={!pick.length} onClick={complete}>Connect {pick.length} account{pick.length === 1 ? "" : "s"}</Button>}>
        <div className="space-y-2.5">{pending.map((a) => <div key={a.external_id} className="rounded-xl border border-line p-3.5"><Checkbox checked={pick.includes(a.external_id)} onChange={(v) => setPick((s) => (v ? [...s, a.external_id] : s.filter((x) => x !== a.external_id)))} label={<span><strong className="text-ink">{a.name}</strong> <span className="text-ink-3">· {a.kind}</span></span>} /></div>)}</div>
      </Modal>
    </>
  );
}
