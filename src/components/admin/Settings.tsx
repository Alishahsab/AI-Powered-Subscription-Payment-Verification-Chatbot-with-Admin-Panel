"use client";

import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { resetDemo, runCleanup, updateState, useStore } from "@/lib/store";
import type { AdminStatus } from "@/lib/types";
import { cx, uid } from "@/lib/utils";
import { Btn, Card, CardHead, LazyInput, Toggle, inputCls } from "./ui";

const accents = [
  { name: "Brand navy", v: "#19335C" },
  { name: "Emerald", v: "#0F7B5F" },
  { name: "Royal", v: "#3B4FD8" },
  { name: "Bronze", v: "#9A6B24" },
  { name: "Charcoal", v: "#1F2329" },
];

const sections = [
  ["availability", "Availability"],
  ["plans", "Plans & pricing"],
  ["payments", "Payment accounts"],
  ["content", "Chat content"],
  ["faqs", "FAQs"],
  ["privacy", "Timers & privacy"],
  ["appearance", "Appearance"],
] as const;

export default function Settings() {
  const s = useStore();
  const st = s.settings;
  const [cleanup, setCleanup] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (fn: Parameters<typeof updateState>[0]) => {
    updateState(fn);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin" id="settings-scroll">
      <div className="max-w-[1100px] mx-auto p-4 lg:p-7 grid lg:grid-cols-[190px_1fr] gap-7">
        <aside className="hidden lg:block">
          <div className="sticky top-0 space-y-0.5">
            <h1 className="text-[20px] font-semibold tracking-tight mb-3">Settings</h1>
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block text-[13px] text-zinc-600 hover:text-zinc-900 px-2 py-1.5 rounded-md hover:bg-zinc-100">{label}</a>
            ))}
            <div className={cx("text-[12px] text-emerald-600 px-2 pt-3 transition", saved ? "opacity-100" : "opacity-0")}>Saved · live on chatbot</div>
          </div>
        </aside>

        <div className="space-y-5 min-w-0">
          <h1 className="lg:hidden text-[20px] font-semibold tracking-tight">Settings</h1>

          {/* availability */}
          <Card>
            <div id="availability" className="scroll-mt-6" />
            <CardHead title="Availability" desc="Controls what customers see after paying, and when buying is open." />
            <div className="px-5 pb-5 space-y-5">
              <div className="grid sm:grid-cols-3 gap-2">
                {(["active", "away", "offline"] as AdminStatus[]).map((k) => (
                  <button key={k} onClick={() => set((d) => void (d.settings.status = k))} className={cx("rounded-lg border p-3 text-left transition", st.status === k ? "border-zinc-900 ring-4 ring-zinc-900/5" : "border-zinc-200 hover:border-zinc-300")}>
                    <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                      <span className={cx("size-2 rounded-full", k === "active" ? "bg-emerald-500" : k === "away" ? "bg-amber-400" : "bg-zinc-400")} />
                      {k === "active" ? "Active" : k === "away" ? "Temporarily unavailable" : "Offline"}
                    </div>
                    <div className="text-[12px] text-zinc-500 mt-1">
                      {k === "active" ? "Codes sent in chat right away" : k === "away" ? "Customers leave email, code sent later" : "Buying paused, support stays open"}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <label className="block">
                  <span className="text-[12.5px] font-medium text-zinc-600">Opens</span>
                  <input type="time" value={st.hours.start} onChange={(e) => set((d) => void (d.settings.hours.start = e.target.value))} className={cx(inputCls, "mt-1 w-36")} />
                </label>
                <label className="block">
                  <span className="text-[12.5px] font-medium text-zinc-600">Closes</span>
                  <input type="time" value={st.hours.end} onChange={(e) => set((d) => void (d.settings.hours.end = e.target.value))} className={cx(inputCls, "mt-1 w-36")} />
                </label>
                <div className="pb-2">
                  <Toggle on={st.hours.enforce} onChange={(v) => set((d) => void (d.settings.hours.enforce = v))} label="Go offline automatically outside these hours" />
                </div>
              </div>
              <div className="grid gap-3">
                {(["active", "away", "offline"] as AdminStatus[]).map((k) => (
                  <label key={k} className="block">
                    <span className="text-[12.5px] font-medium text-zinc-600">Message when {k === "active" ? "active (after payment)" : k === "away" ? "away (after payment)" : "offline (on Buy)"}</span>
                    <LazyInput multiline rows={2} value={st.statusMessages[k]} onCommit={(v) => set((d) => void (d.settings.statusMessages[k] = v))} className="mt-1" />
                  </label>
                ))}
                <p className="text-[11.5px] text-zinc-400">Use {"{hours}"} for working hours and {"{timer}"} for the payment timer.</p>
              </div>
            </div>
          </Card>

          {/* plans */}
          <Card>
            <div id="plans" className="scroll-mt-6" />
            <CardHead title="Plans & pricing" desc="Prices update on the chatbot instantly." />
            <div className="px-5 pb-5 space-y-2">
              {s.plans.map((p, i) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5">
                  <LazyInput value={p.name} onCommit={(v) => set((d) => void (d.plans[i].name = v))} className="w-40" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">Rs</span>
                    <LazyInput value={String(p.price)} inputMode="numeric" onCommit={(v) => set((d) => void (d.plans[i].price = Math.max(0, Number(v.replace(/\D/g, "")) || 0)))} className="w-32 pl-9" />
                  </div>
                  <span className="text-[12px] text-zinc-500">{p.months} month{p.months > 1 ? "s" : ""} · Rs {Math.round(p.price / p.months)}/mo</span>
                  <div className="ml-auto"><Toggle on={p.active} onChange={(v) => set((d) => void (d.plans[i].active = v))} label={p.active ? "Visible" : "Hidden"} /></div>
                </div>
              ))}
            </div>
          </Card>

          {/* payments */}
          <Card>
            <div id="payments" className="scroll-mt-6" />
            <CardHead
              title="Payment accounts"
              desc="Switch an account off if it hits its limit — new orders will show only active accounts."
              right={<Btn size="sm" onClick={() => set((d) => void d.methods.push({ id: uid(), name: "New account", accountTitle: "Premium Store", accountNumber: "", active: false }))}><Plus size={13} /> Add</Btn>}
            />
            <div className="px-5 pb-5 space-y-2">
              {s.methods.map((m, i) => (
                <div key={m.id} className={cx("grid sm:grid-cols-[140px_1fr_1fr_auto_auto] items-center gap-2 rounded-lg border px-3 py-2.5", m.active ? "border-zinc-200" : "border-zinc-200 bg-zinc-50/70")}>
                  <LazyInput value={m.name} onCommit={(v) => set((d) => void (d.methods[i].name = v))} placeholder="Method" />
                  <LazyInput value={m.accountTitle} onCommit={(v) => set((d) => void (d.methods[i].accountTitle = v))} placeholder="Account title" />
                  <LazyInput value={m.accountNumber} onCommit={(v) => set((d) => void (d.methods[i].accountNumber = v))} placeholder="Account number" className="font-mono" />
                  <Toggle on={m.active} onChange={(v) => set((d) => void (d.methods[i].active = v))} />
                  <button onClick={() => set((d) => void d.methods.splice(i, 1))} className="size-8 grid place-items-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </Card>

          {/* content */}
          <Card>
            <div id="content" className="scroll-mt-6" />
            <CardHead title="Chat content" desc="Everything the chatbot says can be edited here." />
            <div className="px-5 pb-5 grid gap-4">
              <Field label="Store name"><LazyInput value={st.storeName} onCommit={(v) => set((d) => void (d.settings.storeName = v))} /></Field>
              <Field label="Welcome message"><LazyInput multiline rows={2} value={st.welcome} onCommit={(v) => set((d) => void (d.settings.welcome = v))} /></Field>
              <Field label="Terms & conditions (one per line)">
                <LazyInput multiline rows={3} value={st.terms.join("\n")} onCommit={(v) => set((d) => void (d.settings.terms = v.split("\n").map((x) => x.trim()).filter(Boolean)))} />
              </Field>
              <Field label="“How does it work?” answer"><LazyInput multiline rows={5} value={st.howItWorks} onCommit={(v) => set((d) => void (d.settings.howItWorks = v))} /></Field>
              <Field label="Support categories (one per line)">
                <LazyInput multiline rows={4} value={st.supportCategories.join("\n")} onCommit={(v) => set((d) => void (d.settings.supportCategories = v.split("\n").map((x) => x.trim()).filter(Boolean)))} />
              </Field>
            </div>
          </Card>

          {/* faqs */}
          <Card>
            <div id="faqs" className="scroll-mt-6" />
            <CardHead title="FAQs" desc={`${s.faqs.length} questions shown in the chatbot`} right={<Btn size="sm" onClick={() => set((d) => void d.faqs.push({ id: uid(), q: "New question", a: "Answer" }))}><Plus size={13} /> Add</Btn>} />
            <div className="px-5 pb-5 space-y-2">
              {s.faqs.map((f, i) => (
                <div key={f.id} className="rounded-lg border border-zinc-200 p-3 space-y-2">
                  <div className="flex gap-2">
                    <LazyInput value={f.q} onCommit={(v) => set((d) => void (d.faqs[i].q = v))} className="font-medium" />
                    <button onClick={() => set((d) => void d.faqs.splice(i, 1))} className="size-9 shrink-0 grid place-items-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                  <LazyInput multiline rows={2} value={f.a} onCommit={(v) => set((d) => void (d.faqs[i].a = v))} />
                </div>
              ))}
            </div>
          </Card>

          {/* privacy */}
          <Card>
            <div id="privacy" className="scroll-mt-6" />
            <CardHead title="Timers & privacy" />
            <div className="px-5 pb-5 space-y-5">
              <Field label="Payment details visible for">
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button key={m} onClick={() => set((d) => void (d.settings.accountTimerMin = m))} className={cx("h-9 px-3.5 rounded-lg border text-[13px] font-medium", st.accountTimerMin === m ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:bg-zinc-50")}>
                      {m} min
                    </button>
                  ))}
                </div>
                <p className="text-[12px] text-zinc-500 mt-1.5">After this, account details are hidden and the unpaid order expires automatically.</p>
              </Field>
              <Field label="Delete old chats & screenshots after">
                <div className="flex flex-wrap items-center gap-2">
                  {[7, 15, 30].map((n) => (
                    <button key={n} onClick={() => set((d) => void (d.settings.retentionDays = n))} className={cx("h-9 px-3.5 rounded-lg border text-[13px] font-medium", st.retentionDays === n ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:bg-zinc-50")}>
                      {n} days
                    </button>
                  ))}
                  <Btn className="ml-auto" onClick={() => { const r = runCleanup(); setCleanup(`Removed ${r.messages} old messages and ${r.screenshots} screenshots. Codes and order history kept.`); }}>
                    Run clean-up now
                  </Btn>
                </div>
                <p className="text-[12px] text-zinc-500 mt-1.5">Codes and Order History are always kept so customers can see past codes.</p>
                {cleanup && <p className="text-[12.5px] text-emerald-700 mt-2 fade">{cleanup}</p>}
              </Field>
            </div>
          </Card>

          {/* appearance */}
          <Card>
            <div id="appearance" className="scroll-mt-6" />
            <CardHead title="Appearance" desc="Accent colour of the customer chatbot." />
            <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
              {accents.map((a) => (
                <button key={a.v} onClick={() => set((d) => void (d.settings.accent = a.v))} className={cx("flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-lg border text-[13px]", st.accent.toLowerCase() === a.v.toLowerCase() ? "border-zinc-900 ring-4 ring-zinc-900/5" : "border-zinc-200")}>
                  <span className="size-7 rounded-md" style={{ background: a.v }} /> {a.name}
                </button>
              ))}
              <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-zinc-200 text-[13px] cursor-pointer">
                <input type="color" value={st.accent} onChange={(e) => set((d) => void (d.settings.accent = e.target.value))} className="size-6 rounded cursor-pointer" /> Custom
              </label>
            </div>
          </Card>

          <Card>
            <CardHead title="Demo data" desc="Restore the sample customers, orders and codes used for this presentation." right={<Btn variant="danger" onClick={() => confirm("Reset all demo data?") && resetDemo()}><RotateCcw size={14} /> Reset demo</Btn>} />
            <div className="h-1" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12.5px] font-medium text-zinc-600 mb-1">{label}</div>
      {children}
    </div>
  );
}
