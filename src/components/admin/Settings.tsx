"use client";

import { useState } from "react";
import { Check, Clock, CreditCard, HelpCircle, MessageSquareText, Palette, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { resetDemo, runCleanup, updateState, useStore } from "@/lib/store";
import type { AdminStatus, Faq, PaymentMethod, Plan, Settings as SettingsT, State } from "@/lib/types";
import { cx, uid } from "@/lib/utils";
import { Btn, Card, Toggle, inputCls } from "./ui";

type Draft = { settings: SettingsT; plans: Plan[]; methods: PaymentMethod[]; faqs: Faq[] };
const pick = (s: State): Draft => structuredClone({ settings: s.settings, plans: s.plans, methods: s.methods, faqs: s.faqs });
// status is switched instantly from the top bar, so it never counts as an unsaved change
const comparable = (d: Draft) => JSON.stringify({ ...d, settings: { ...d.settings, status: null } });

const tabs = [
  { k: "availability", label: "Availability", icon: <Clock size={15} /> },
  { k: "plans", label: "Plans & payments", icon: <CreditCard size={15} /> },
  { k: "messages", label: "Chat messages", icon: <MessageSquareText size={15} /> },
  { k: "faqs", label: "FAQs", icon: <HelpCircle size={15} /> },
  { k: "privacy", label: "Privacy & data", icon: <ShieldCheck size={15} /> },
  { k: "appearance", label: "Appearance", icon: <Palette size={15} /> },
] as const;
type Tab = (typeof tabs)[number]["k"];

const accents = [
  { name: "Brand navy", v: "#0C2660" },
  { name: "Emerald", v: "#0F7B5F" },
  { name: "Royal", v: "#3B4FD8" },
  { name: "Bronze", v: "#9A6B24" },
  { name: "Charcoal", v: "#1F2329" },
];

export default function Settings() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>("availability");
  const [draft, setDraft] = useState<Draft>(() => pick(s));
  const [base, setBase] = useState(() => comparable(pick(s)));
  const [savedAt, setSavedAt] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const live = comparable(pick(s));
  const dirty = comparable(draft) !== live;
  // pick up changes made elsewhere (another tab, a reset) when nothing is being edited
  if (live !== base) {
    setBase(live);
    if (comparable(draft) === base) setDraft(pick(s));
  }

  const edit = (fn: (d: Draft) => void) =>
    setDraft((prev) => {
      const d = structuredClone(prev);
      fn(d);
      return d;
    });

  const save = () => {
    const clean = structuredClone(draft);
    const lines = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);
    clean.settings.terms = lines(clean.settings.terms);
    clean.settings.supportCategories = lines(clean.settings.supportCategories);
    clean.faqs = clean.faqs.filter((f) => f.q.trim() && f.a.trim());
    updateState((st) => {
      const status = st.settings.status;
      st.settings = { ...clean.settings, status };
      st.plans = clean.plans;
      st.methods = clean.methods;
      st.faqs = clean.faqs;
    });
    setDraft(clean);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(0), 2500);
  };
  const discard = () => setDraft(pick(s));

  const st = draft.settings;

  return (
    <div className="h-full flex flex-col">
      {/* header with save */}
      <div className="shrink-0 bg-white border-b border-zinc-200/80">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-7 pt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[21px] font-semibold tracking-tight">Settings</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">Changes go live on the chatbot when you press Save.</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty ? (
              <span className="text-[12.5px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium">Unsaved changes</span>
            ) : savedAt ? (
              <span className="text-[12.5px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 fade">
                <Check size={13} /> Saved and live
              </span>
            ) : null}
            <Btn onClick={discard} disabled={!dirty}>Discard</Btn>
            <Btn variant="primary" onClick={save} disabled={!dirty} className="px-5">
              <Check size={15} /> Save changes
            </Btn>
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto px-4 lg:px-7 mt-4 flex gap-1 overflow-x-auto scroll-thin">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cx(
                "h-10 px-3.5 text-[13.5px] font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition",
                tab === t.k ? "border-[#0C2660] text-[#0C2660]" : "border-transparent text-zinc-500 hover:text-zinc-800"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-[1000px] mx-auto p-4 lg:p-7 space-y-5">
          {tab === "availability" && (
            <>
              <Section title="Your status" desc="Switches instantly, also available in the top bar.">
                <div className="grid sm:grid-cols-3 gap-2">
                  {(["active", "away", "offline"] as AdminStatus[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => updateState((d) => void (d.settings.status = k))}
                      className={cx("rounded-xl border p-3.5 text-left transition", s.settings.status === k ? "border-[#0C2660] ring-4 ring-[#0C2660]/10" : "border-zinc-200 hover:border-zinc-300")}
                    >
                      <div className="flex items-center gap-2 text-[14px] font-semibold">
                        <span className={cx("size-2 rounded-full", k === "active" ? "bg-emerald-500" : k === "away" ? "bg-amber-400" : "bg-zinc-400")} />
                        {k === "active" ? "Active" : k === "away" ? "Temporarily away" : "Offline"}
                      </div>
                      <div className="text-[12.5px] text-zinc-500 mt-1">
                        {k === "active" ? "Codes sent in chat right away" : k === "away" ? "Customer leaves email, code sent later" : "Buying paused, support open"}
                      </div>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Working hours" desc="When subscriptions can be bought.">
                <div className="flex flex-wrap items-end gap-4">
                  <Field label="Opens">
                    <div className="w-36"><input type="time" value={st.hours.start} onChange={(e) => edit((d) => void (d.settings.hours.start = e.target.value))} className={inputCls} /></div>
                  </Field>
                  <Field label="Closes">
                    <div className="w-36"><input type="time" value={st.hours.end} onChange={(e) => edit((d) => void (d.settings.hours.end = e.target.value))} className={inputCls} /></div>
                  </Field>
                  <div className="pb-2">
                    <Toggle on={st.hours.enforce} onChange={(v) => edit((d) => void (d.settings.hours.enforce = v))} label="Go offline automatically outside these hours" />
                  </div>
                </div>
              </Section>

              <Section title="Status messages" desc="What the customer sees. Use {hours} and {timer} as placeholders.">
                <div className="space-y-4">
                  {(["active", "away", "offline"] as AdminStatus[]).map((k) => (
                    <Field key={k} label={k === "active" ? "When active (after payment)" : k === "away" ? "When away (after payment)" : "When offline (on Buy)"}>
                      <textarea rows={2} value={st.statusMessages[k]} onChange={(e) => edit((d) => void (d.settings.statusMessages[k] = e.target.value))} className={cx(inputCls, "h-auto py-2 leading-relaxed")} />
                    </Field>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === "plans" && (
            <>
              <Section title="Plans & pricing" desc="Hidden plans are not shown to customers.">
                <div className="divide-y divide-zinc-100 -my-2">
                  {draft.plans.map((p, i) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="w-40"><input value={p.name} onChange={(e) => edit((d) => void (d.plans[i].name = e.target.value))} className={inputCls} /></div>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">Rs</span>
                        <input
                          value={String(p.price)}
                          inputMode="numeric"
                          onChange={(e) => edit((d) => void (d.plans[i].price = Number(e.target.value.replace(/\D/g, "")) || 0))}
                          className={cx(inputCls, "pl-9")}
                        />
                      </div>
                      <span className="text-[12.5px] text-zinc-500">Rs {Math.round(p.price / p.months)} per month</span>
                      <div className="ml-auto">
                        <Toggle on={p.active} onChange={(v) => edit((d) => void (d.plans[i].active = v))} label={p.active ? "Visible" : "Hidden"} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="Payment accounts"
                desc="Turn an account off when it reaches its limit. New orders only show active accounts."
                right={
                  <Btn size="sm" onClick={() => edit((d) => void d.methods.push({ id: uid(), name: "New account", accountTitle: "Premium Store", accountNumber: "", active: false }))}>
                    <Plus size={13} /> Add account
                  </Btn>
                }
              >
                <div className="space-y-2">
                  <div className="hidden sm:grid grid-cols-[150px_1fr_1fr_80px_36px] gap-2 px-1 text-[12px] text-zinc-500 font-medium">
                    <span>Method</span>
                    <span>Account title</span>
                    <span>Account number</span>
                    <span>Active</span>
                    <span />
                  </div>
                  {draft.methods.map((m, i) => (
                    <div key={m.id} className={cx("grid sm:grid-cols-[150px_1fr_1fr_80px_36px] items-center gap-2 rounded-xl p-2", !m.active && "bg-zinc-50")}>
                      <input value={m.name} onChange={(e) => edit((d) => void (d.methods[i].name = e.target.value))} placeholder="Method" className={inputCls} />
                      <input value={m.accountTitle} onChange={(e) => edit((d) => void (d.methods[i].accountTitle = e.target.value))} placeholder="Account title" className={inputCls} />
                      <input value={m.accountNumber} onChange={(e) => edit((d) => void (d.methods[i].accountNumber = e.target.value))} placeholder="Account number" className={cx(inputCls, "tabular-nums")} />
                      <Toggle on={m.active} onChange={(v) => edit((d) => void (d.methods[i].active = v))} />
                      <button onClick={() => edit((d) => void d.methods.splice(i, 1))} className="size-9 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50" title="Remove">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === "messages" && (
            <Section title="Chat messages" desc="Everything the chatbot says.">
              <div className="space-y-4">
                <Field label="Store name">
                  <input value={st.storeName} onChange={(e) => edit((d) => void (d.settings.storeName = e.target.value))} className={inputCls} />
                </Field>
                <Field label="Welcome message">
                  <textarea rows={2} value={st.welcome} onChange={(e) => edit((d) => void (d.settings.welcome = e.target.value))} className={cx(inputCls, "h-auto py-2 leading-relaxed")} />
                </Field>
                <Field label="Terms & conditions" hint="One per line">
                  <textarea rows={3} value={st.terms.join("\n")} onChange={(e) => edit((d) => void (d.settings.terms = e.target.value.split("\n")))} className={cx(inputCls, "h-auto py-2 leading-relaxed")} />
                </Field>
                <Field label="How does it work? answer">
                  <textarea rows={5} value={st.howItWorks} onChange={(e) => edit((d) => void (d.settings.howItWorks = e.target.value))} className={cx(inputCls, "h-auto py-2 leading-relaxed")} />
                </Field>
                <Field label="Support categories" hint="One per line">
                  <textarea rows={4} value={st.supportCategories.join("\n")} onChange={(e) => edit((d) => void (d.settings.supportCategories = e.target.value.split("\n")))} className={cx(inputCls, "h-auto py-2 leading-relaxed")} />
                </Field>
              </div>
            </Section>
          )}

          {tab === "faqs" && (
            <Section
              title="FAQs"
              desc={`${draft.faqs.length} questions shown in the chatbot`}
              right={
                <Btn size="sm" onClick={() => edit((d) => void d.faqs.push({ id: uid(), q: "", a: "" }))}>
                  <Plus size={13} /> Add question
                </Btn>
              }
            >
              <div className="space-y-3">
                {draft.faqs.map((f, i) => (
                  <div key={f.id} className="rounded-xl border border-zinc-200 p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="mt-2 size-6 shrink-0 rounded-md bg-zinc-100 text-zinc-600 text-[12px] font-semibold grid place-items-center">{i + 1}</span>
                      <div className="flex-1 space-y-2">
                        <input value={f.q} placeholder="Question" onChange={(e) => edit((d) => void (d.faqs[i].q = e.target.value))} className={cx(inputCls, "font-medium")} />
                        <textarea rows={2} value={f.a} placeholder="Answer" onChange={(e) => edit((d) => void (d.faqs[i].a = e.target.value))} className={cx(inputCls, "h-auto py-2 leading-relaxed")} />
                      </div>
                      <button onClick={() => edit((d) => void d.faqs.splice(i, 1))} className="size-9 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50" title="Remove">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tab === "privacy" && (
            <>
              <Section title="Payment details timer" desc="After this time account details are hidden and unpaid orders expire.">
                <Choice values={[1, 5, 10, 15, 30]} value={st.accountTimerMin} unit="min" onChange={(v) => edit((d) => void (d.settings.accountTimerMin = v))} />
              </Section>
              <Section title="Chat clean-up" desc="Old chats and screenshots are deleted after this many days. Codes and Order History are always kept.">
                <Choice values={[7, 15, 30]} value={st.retentionDays} unit="days" onChange={(v) => edit((d) => void (d.settings.retentionDays = v))} />
                <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3">
                  <Btn
                    onClick={() => {
                      const r = runCleanup();
                      setNote(`Removed ${r.messages} old messages and ${r.screenshots} screenshots. Codes and order history kept.`);
                    }}
                  >
                    Run clean-up now
                  </Btn>
                  {note && <span className="text-[12.5px] text-emerald-700 fade">{note}</span>}
                </div>
              </Section>
              <Section title="Demo data" desc="Restore the sample customers, orders and codes.">
                <Btn variant="danger" onClick={() => confirm("Reset all demo data?") && resetDemo()}>
                  <RotateCcw size={14} /> Reset demo
                </Btn>
              </Section>
            </>
          )}

          {tab === "appearance" && (
            <Section title="Chatbot colour" desc="Accent colour used on the customer chatbot.">
              <div className="flex flex-wrap items-center gap-2.5">
                {accents.map((a) => (
                  <button
                    key={a.v}
                    onClick={() => edit((d) => void (d.settings.accent = a.v))}
                    className={cx("flex items-center gap-2 h-11 pl-1.5 pr-3.5 rounded-xl border text-[13px] font-medium", st.accent.toLowerCase() === a.v.toLowerCase() ? "border-[#0C2660] ring-4 ring-[#0C2660]/10" : "border-zinc-200")}
                  >
                    <span className="size-8 rounded-lg" style={{ background: a.v }} /> {a.name}
                  </button>
                ))}
                <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-zinc-200 text-[13px] font-medium cursor-pointer">
                  <input type="color" value={st.accent} onChange={(e) => edit((d) => void (d.settings.accent = e.target.value))} className="size-7 rounded cursor-pointer" /> Custom
                </label>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-zinc-100">
        <div>
          <div className="font-semibold text-[15px] text-zinc-900">{title}</div>
          {desc && <div className="text-[12.5px] text-zinc-500 mt-0.5">{desc}</div>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[13px] font-medium text-zinc-700 mb-1.5">
        {label} {hint && <span className="text-zinc-400 font-normal">· {hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Choice({ values, value, unit, onChange }: { values: number[]; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cx("h-10 px-4 rounded-xl border text-[13.5px] font-medium transition", value === v ? "bg-[#0C2660] text-white border-[#0C2660]" : "border-zinc-200 hover:bg-zinc-50")}
        >
          {v} {unit}
        </button>
      ))}
    </div>
  );
}
