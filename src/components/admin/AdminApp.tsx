"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell, Eye, EyeOff, Inbox as InboxIcon, KeyRound, LayoutDashboard, Lock, LogOut, Menu, Search, Settings as SettingsIcon, Users, X, ExternalLink,
} from "lucide-react";
import { markAllNotificationsRead, updateState, useStore } from "@/lib/store";
import type { AdminStatus } from "@/lib/types";
import { beep, cx, effectiveStatus, timeAgo, withinHours } from "@/lib/utils";
import { useExpirySweep, useNow } from "@/components/shared";
import Dashboard from "./Dashboard";
import Inbox, { type InboxTab } from "./Inbox";
import Codes from "./Codes";
import Customers from "./Customers";
import SearchResults from "./SearchResults";
import Settings from "./Settings";

export type Section = "dashboard" | "inbox" | "codes" | "customers" | "settings" | "search";
export type Nav = { section: Section; tab?: InboxTab; customerId?: string };
export type Go = (n: Nav) => void;

const ADMIN_SESSION = "ps_admin";
// Demo credentials; override per deployment with NEXT_PUBLIC_ADMIN_USER / NEXT_PUBLIC_ADMIN_PASSWORD.
const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION) === "1";
    } catch {
      return false;
    }
  });
  if (!authed)
    return (
      <Login
        onDone={() => {
          try {
            sessionStorage.setItem(ADMIN_SESSION, "1");
          } catch {}
          setAuthed(true);
        }}
      />
    );
  return (
    <Shell
      onLogout={() => {
        try {
          sessionStorage.removeItem(ADMIN_SESSION);
        } catch {}
        setAuthed(false);
      }}
    />
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const field =
    "mt-1.5 w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[15px] outline-none focus:bg-white focus:border-[#0C2660] focus:ring-4 focus:ring-[#0C2660]/10 transition";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pw) return setErr("Enter your username and password.");
    // Demo-only check. Real sign-in moves to Supabase Auth with the database.
    if (user.trim().toLowerCase() === ADMIN_USER.toLowerCase() && pw === ADMIN_PASSWORD) onDone();
    else setErr("Incorrect username or password.");
  };

  return (
    <div className="adm min-h-dvh grid place-items-center px-4 py-8">
          <form onSubmit={submit} className="w-full max-w-[400px] bg-white rounded-2xl border border-zinc-200 shadow-sm p-7 md:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark-dark.png" alt="Premium Store" className="h-12 w-auto select-none" draggable={false} />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-[21px] font-semibold tracking-tight">Admin sign in</h1>
            <p className="text-[13.5px] text-zinc-500 mt-1">Premium Store management panel</p>

            <label className="block mt-6">
              <span className="text-[13.5px] font-semibold text-zinc-800">Username</span>
              <input autoFocus autoComplete="username" value={user} onChange={(e) => { setUser(e.target.value); setErr(""); }} placeholder="Enter username" className={field} />
            </label>
            <label className="block mt-4">
              <span className="text-[13.5px] font-semibold text-zinc-800">Password</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setErr(""); }}
                  placeholder="Enter password"
                  className={cx(field, "pr-12")}
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-[calc(50%+3px)] -translate-y-1/2 size-9 grid place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}

            <button className="mt-6 w-full h-12 rounded-xl bg-[#0C2660] text-white text-[15.5px] font-semibold flex items-center justify-center gap-2 shadow-[0_12px_28px_-14px_#0C2660] hover:brightness-125 transition">
              <Lock size={16} /> Sign in
            </button>
          </form>
    </div>
  );
}

const statusOpts: { k: AdminStatus; label: string; dot: string }[] = [
  { k: "active", label: "Active", dot: "bg-emerald-500" },
  { k: "away", label: "Away", dot: "bg-amber-400" },
  { k: "offline", label: "Offline", dot: "bg-zinc-400" },
];

function Shell({ onLogout }: { onLogout: () => void }) {
  const s = useStore();
  const now = useNow(30_000);
  const [nav, setNav] = useState<Nav>({ section: "dashboard" });
  const [query, setQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; title: string; body: string; customerId?: string }[]>([]);
  const seen = useRef<Set<string>>(new Set(s.notifications.map((n) => n.id)));
  useExpirySweep();

  const go: Go = (n) => {
    setNav(n);
    setMenuOpen(false);
    if (n.section !== "search") setQuery("");
  };

  // toast + sound for new notifications (including ones created in the customer tab)
  useEffect(() => {
    const fresh = s.notifications.filter((n) => !seen.current.has(n.id));
    if (!fresh.length) return;
    fresh.forEach((n) => seen.current.add(n.id));
    const unread = fresh.filter((n) => !n.read);
    if (!unread.length) return;
    beep();
    setToasts((t) => [...unread.map((n) => ({ id: n.id, title: n.title, body: n.body, customerId: n.customerId })), ...t].slice(0, 3));
    unread.forEach((n) => setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 6000));
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden)
      unread.forEach((n) => new Notification(n.title, { body: n.body }));
  }, [s.notifications]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  }, []);

  const pending = s.orders.filter((o) => o.status === "pending_review").length;
  const unreadChats = Object.values(s.conversations).filter((c) => c.unreadAdmin > 0).length;
  const unreadNotes = s.notifications.filter((n) => !n.read).length;
  const eff = effectiveStatus(s.settings, now);
  const outside = s.settings.hours.enforce && !withinHours(s.settings, now);

  const items: { k: Section; label: string; icon: React.ReactNode; count?: number }[] = [
    { k: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { k: "inbox", label: "Inbox", icon: <InboxIcon size={17} />, count: pending + unreadChats },
    { k: "codes", label: "Codes", icon: <KeyRound size={17} /> },
    { k: "customers", label: "Customers", icon: <Users size={17} /> },
    { k: "settings", label: "Settings", icon: <SettingsIcon size={17} /> },
  ];

  const sidebar = (
    <div className="h-full flex flex-col bg-[linear-gradient(180deg,#0c2660_0%,#061639_100%)] text-white/75">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wordmark.png" alt={s.settings.storeName} className="h-8 w-auto select-none" draggable={false} />
        <span className="ml-auto text-[10.5px] uppercase tracking-[0.14em] text-white/50 font-semibold">Admin</span>
      </div>
      <nav className="p-3 space-y-0.5 flex-1">
        {items.map((it) => (
          <button
            key={it.k}
            onClick={() => go({ section: it.k })}
            className={cx(
              "w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] transition",
              nav.section === it.k ? "bg-white/[0.12] text-white font-medium shadow-[inset_3px_0_0_#C9A45C]" : "hover:bg-white/[0.06] hover:text-white"
            )}
          >
            {it.icon}
            <span className="flex-1 text-left">{it.label}</span>
            {!!it.count && <span className="text-[11px] font-semibold bg-[#C9A45C] text-[#1a1406] rounded-full min-w-5 h-5 px-1.5 grid place-items-center">{it.count}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <a href={process.env.NEXT_PUBLIC_CUSTOMER_URL || "/"} target="_blank" className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] hover:bg-white/[0.06] hover:text-white">
          <ExternalLink size={16} /> Open customer chat
        </a>
        <button onClick={onLogout} className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] hover:bg-white/[0.06] hover:text-white">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="adm h-dvh flex overflow-hidden">
      <aside className="hidden lg:block w-[244px] shrink-0">{sidebar}</aside>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 fade" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[260px] sheet-left">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* topbar */}
        <header className="h-16 shrink-0 bg-white border-b border-zinc-200/80 flex items-center gap-3 px-4 lg:px-6">
          <button onClick={() => setMenuOpen(true)} className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100"><Menu size={19} /></button>
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setNav({ section: "search" });
              }}
              placeholder="Search codes, customers, orders, messages…"
              className="w-full h-9 rounded-lg bg-zinc-100/80 border border-transparent pl-9 pr-8 text-[13.5px] outline-none focus:bg-white focus:border-zinc-300 transition"
            />
            {query && (
              <button onClick={() => go({ section: "dashboard" })} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"><X size={15} /></button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center rounded-lg bg-zinc-100 p-0.5" title={outside ? "Outside working hours, buying is paused" : undefined}>
              {statusOpts.map((o) => (
                <button
                  key={o.k}
                  onClick={() => updateState((d) => void (d.settings.status = o.k))}
                  className={cx(
                    "h-8 px-3 rounded-md text-[12.5px] font-medium flex items-center gap-1.5 transition",
                    s.settings.status === o.k ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
                  )}
                >
                  <span className={cx("size-1.5 rounded-full", o.dot)} />
                  {o.label}
                </button>
              ))}
            </div>
            {outside && eff === "offline" && s.settings.status !== "offline" && (
              <span className="hidden xl:inline text-[11.5px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md">Outside hours</span>
            )}
            <div className="relative">
              <button onClick={() => setBellOpen((v) => !v)} className="relative size-9 grid place-items-center rounded-lg hover:bg-zinc-100">
                <Bell size={18} />
                {!!unreadNotes && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">{unreadNotes}</span>}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-11 z-40 w-[340px] bg-white rounded-xl border border-zinc-200 shadow-xl fade">
                    <div className="flex items-center justify-between px-4 h-11 border-b border-zinc-100">
                      <span className="font-semibold text-[13.5px]">Notifications</span>
                      <button onClick={markAllNotificationsRead} className="text-[12px] text-zinc-500 hover:text-zinc-900">Mark all read</button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto scroll-thin">
                      {s.notifications.slice(0, 15).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setBellOpen(false);
                            go({ section: "inbox", customerId: n.customerId, tab: n.type === "order" ? "pending" : n.type === "ticket" ? "issues" : "general" });
                          }}
                          className="w-full text-left px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 flex gap-3"
                        >
                          <span className={cx("mt-1.5 size-2 rounded-full shrink-0", n.read ? "bg-transparent" : "bg-red-500")} />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-zinc-900">{n.title}</span>
                            <span className="block text-[12.5px] text-zinc-500 truncate">{n.body}</span>
                            <span className="block text-[11px] text-zinc-400 mt-0.5">{timeAgo(n.createdAt, now)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="size-9 rounded-full bg-[#0C2660] text-white grid place-items-center text-[12px] font-semibold">AD</div>
          </div>
        </header>

        {/* mobile status */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-white border-b border-zinc-200/80">
          {statusOpts.map((o) => (
            <button
              key={o.k}
              onClick={() => updateState((d) => void (d.settings.status = o.k))}
              className={cx("flex-1 h-8 rounded-md text-[12.5px] font-medium flex items-center justify-center gap-1.5", s.settings.status === o.k ? "bg-[#0C2660] text-white" : "bg-zinc-100 text-zinc-600")}
            >
              <span className={cx("size-1.5 rounded-full", o.dot)} /> {o.label}
            </button>
          ))}
        </div>

        <main className="flex-1 min-h-0 overflow-hidden">
          {nav.section === "dashboard" && <Dashboard go={go} />}
          {nav.section === "inbox" && <Inbox key={(nav.customerId ?? "") + (nav.tab ?? "")} initialTab={nav.tab} initialCustomer={nav.customerId} />}
          {nav.section === "codes" && <Codes />}
          {nav.section === "customers" && <Customers go={go} />}
          {nav.section === "settings" && <Settings />}
          {nav.section === "search" && <SearchResults query={query} go={go} />}
        </main>
      </div>

      {/* toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-[320px]">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setToasts((x) => x.filter((y) => y.id !== t.id));
              go({ section: "inbox", customerId: t.customerId, tab: t.title.startsWith("Payment") ? "pending" : t.title.includes("issue") ? "issues" : "general" });
            }}
            className="toast w-full text-left bg-[#0C2660] text-white rounded-xl shadow-2xl px-4 py-3 flex gap-3"
          >
            <span className="mt-1 size-2 rounded-full bg-[#C9A45C] shrink-0" />
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold">{t.title}</span>
              <span className="block text-[12.5px] text-zinc-300 truncate">{t.body}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
