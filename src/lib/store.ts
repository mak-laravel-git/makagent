"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SEED, type Seed } from "./data";

/**
 * Browser-local demo store (ported from assets/js/store.js).
 * - SSR / first paint always renders the deterministic seed, so hydration never mismatches.
 * - After mount the persisted state in localStorage is adopted and subscribers are notified.
 */
const KEY = "MakAgent.next.v3";
const clone = <T,>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

type State = Seed & Record<string, any>;
let state: State = SEED as State;
let loaded = false;
let memoryOnly = false;
const listeners = new Set<() => void>();

function fresh(): State {
  return clone(SEED) as State;
}

function load(): State {
  if (loaded || typeof window === "undefined") return state;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    state = parsed && parsed.schemaVersion === SEED.schemaVersion ? parsed : fresh();
  } catch {
    state = fresh();
    memoryOnly = true;
  }
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    memoryOnly = true;
    window.dispatchEvent(new CustomEvent("sp:storage-error"));
  }
  state = { ...state }; // new root identity for subscribers
  emit();
}

function read(obj: any, path?: string) {
  if (!path) return obj;
  return String(path).split(".").reduce((v, k) => (v == null ? undefined : v[k]), obj);
}

function write(obj: any, path: string, value: unknown) {
  const keys = String(path).split(".");
  if (keys.some((k) => ["__proto__", "prototype", "constructor"].includes(k))) throw new Error("Invalid store key");
  let target = obj;
  keys.slice(0, -1).forEach((k) => {
    if (!target[k] || typeof target[k] !== "object") target[k] = {};
    target = target[k];
  });
  target[keys[keys.length - 1]] = clone(value);
}

export const store = {
  /** Adopt persisted state (call once on the client). */
  hydrate() {
    if (loaded) return;
    load();
    emit();
  },
  get<T = any>(path: string, fallback?: T): T {
    load();
    const r = read(state, path);
    return (r === undefined ? clone(fallback) : r) as T;
  },
  set<T = any>(path: string, value: T): T {
    load();
    state = clone(state);
    write(state, path, value);
    persist();
    return value;
  },
  update<T = any>(path: string, fn: (draft: T) => T | void): T {
    load();
    const draft = clone(read(state, path)) as T;
    const result = fn(draft);
    return this.set(path, (result === undefined ? draft : result) as T);
  },
  add(path: string, item: Record<string, any>) {
    this.update<any[]>(path, (items) => {
      items.push({ ...item, id: item.id || uid() });
    });
  },
  patch(path: string, id: string, values: Record<string, unknown>) {
    this.update<any[]>(path, (items) => {
      const it = items.find((x) => x.id === id);
      if (it) Object.assign(it, values);
    });
  },
  remove(path: string, id: string) {
    this.update<any[]>(path, (items) => items.filter((x) => x.id !== id));
  },
  reset() {
    state = fresh();
    loaded = true;
    persist();
  },
  session() {
    return this.get("session", SEED.session);
  },
  login(role: "client" | "admin", email?: string) {
    return this.set("session", {
      role,
      email: email || "nusrat@dhakathreads.example",
      clientId: "cl-dhaka",
      name: role === "admin" ? "Platform Admin" : "Nusrat Jahan",
      impersonating: false,
    });
  },
  logout() {
    return this.set("session", { role: null, clientId: null, impersonating: false, email: "", name: "" });
  },
  get memoryOnly() {
    load();
    return memoryOnly;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot() {
    return state;
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      emit();
    }
  });
}

export const uid = () => "sp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
export const money = (n: number | string) => "৳" + Number(n).toLocaleString("en-BD");

/** Subscribe to a path in the store. Re-renders when anything changes. */
export function useStore<T = any>(path: string, fallback?: T): T {
  const root = useSyncExternalStore(store.subscribe, store.snapshot, () => SEED as State);
  // `root` identity changes on every write, which re-renders consumers.
  void root;
  const value = read(root, path);
  return (value === undefined ? fallback : value) as T;
}

/** Convenience: [value, setValue] pair bound to a store path. */
export function useStoreState<T = any>(path: string, fallback?: T): [T, (v: T | ((d: T) => T | void)) => void] {
  const value = useStore<T>(path, fallback);
  const setter = useCallback(
    (v: T | ((d: T) => T | void)) => {
      if (typeof v === "function") store.update<T>(path, v as (d: T) => T | void);
      else store.set(path, v);
    },
    [path],
  );
  return [value, setter];
}

export function download(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
