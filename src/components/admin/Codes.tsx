"use client";

import { useMemo, useRef, useState } from "react";
import { FileUp, KeyRound, Search, Trash2 } from "lucide-react";
import { addCodes, deleteCode, useStore } from "@/lib/store";
import { cx, fmtDateTime } from "@/lib/utils";
import { Badge, Btn, Card, CardHead, Empty, inputCls } from "./ui";

export default function Codes() {
  const s = useStore();
  const [plan, setPlan] = useState(s.plans[0].id);
  const [filter, setFilter] = useState<"all" | "available" | "assigned">("all");
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState("");
  const [addPlan, setAddPlan] = useState(s.plans[0].id);
  const [result, setResult] = useState<{ added: number; duplicates: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const name = (id?: string) => s.customers.find((c) => c.id === id)?.name ?? "—";
  const rows = useMemo(
    () =>
      s.codes
        .filter((k) => k.planId === plan && (filter === "all" || k.status === filter) && (!q || k.value.includes(q.trim()) || name(k.customerId).toLowerCase().includes(q.toLowerCase())))
        .sort((a, b) => (a.status === b.status ? (b.assignedAt ?? b.addedAt) - (a.assignedAt ?? a.addedAt) : a.status === "available" ? -1 : 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.codes, plan, filter, q]
  );

  const submit = (text: string) => {
    const vals = text.split(/[\s,;]+/).filter(Boolean);
    if (!vals.length) return;
    setResult(addCodes(addPlan, vals));
    setBulk("");
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="max-w-[1200px] mx-auto p-4 lg:p-7 space-y-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Codes</h1>
          <p className="text-[13.5px] text-zinc-500 mt-0.5">Upload the codes you receive. The right code is assigned automatically when you approve a payment — a code can never be sent twice.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {s.plans.map((p) => {
            const avail = s.codes.filter((k) => k.planId === p.id && k.status === "available").length;
            const used = s.codes.filter((k) => k.planId === p.id && k.status === "assigned").length;
            return (
              <button key={p.id} onClick={() => setPlan(p.id)} className={cx("text-left rounded-xl border p-4 transition bg-white", plan === p.id ? "border-zinc-900 ring-4 ring-zinc-900/5" : "border-zinc-200 hover:border-zinc-300")}>
                <div className="text-[12.5px] text-zinc-500 font-medium">{p.name}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={cx("text-[24px] font-semibold tabular-nums", avail < 5 && "text-red-600")}>{avail}</span>
                  <span className="text-[12.5px] text-zinc-500">available</span>
                </div>
                <div className="text-[12px] text-zinc-400">{used} sent</div>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <Card>
            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-zinc-100">
              <div className="flex rounded-lg bg-zinc-100 p-0.5">
                {(["all", "available", "assigned"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={cx("h-7 px-2.5 rounded-md text-[12.5px] font-medium capitalize", filter === f ? "bg-white shadow-sm" : "text-zinc-500")}>
                    {f === "assigned" ? "Sent" : f}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto w-full sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find code or customer" className={cx(inputCls, "pl-8 h-8")} />
              </div>
            </div>
            {!rows.length ? (
              <Empty icon={<KeyRound size={20} />} title="No codes" desc="Add codes using the panel on the right." />
            ) : (
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto scroll-thin">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-zinc-50">
                    <tr className="text-left text-zinc-500 border-b border-zinc-100">
                      <th className="font-medium px-5 py-2">Code</th>
                      <th className="font-medium px-3 py-2">Status</th>
                      <th className="font-medium px-3 py-2">Sent to</th>
                      <th className="font-medium px-3 py-2">Date</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((k) => (
                      <tr key={k.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                        <td className="px-5 py-2.5 font-mono font-semibold tracking-wider">{k.value}</td>
                        <td className="px-3 py-2.5">{k.status === "available" ? <Badge tone="green">Available</Badge> : <Badge>Sent</Badge>}</td>
                        <td className="px-3 py-2.5">{k.status === "assigned" ? <span>{name(k.customerId)} <span className="text-zinc-400">· {k.orderId}</span></span> : <span className="text-zinc-400">—</span>}</td>
                        <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">{fmtDateTime(k.assignedAt ?? k.addedAt)}</td>
                        <td className="px-3 py-2.5 text-right">
                          {k.status === "available" && (
                            <button onClick={() => deleteCode(k.id)} className="size-7 grid place-items-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50" title="Remove">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHead title="Add codes" desc="Paste one code per line, or import a .txt / .csv file" />
            <div className="px-5 pb-5 space-y-3">
              <select value={addPlan} onChange={(e) => setAddPlan(e.target.value)} className={inputCls}>
                {s.plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={7} placeholder={"482913\n730451\n119284"} className={cx(inputCls, "h-auto py-2 font-mono")} />
              <div className="flex gap-2">
                <Btn variant="primary" className="flex-1" onClick={() => submit(bulk)} disabled={!bulk.trim()}>Add codes</Btn>
                <input ref={fileRef} type="file" accept=".txt,.csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) submit(await f.text()); e.target.value = ""; }} />
                <Btn onClick={() => fileRef.current?.click()}><FileUp size={14} /> Import</Btn>
              </div>
              {result && (
                <div className="text-[12.5px] rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2.5 fade">
                  <div className="text-emerald-700 font-medium">{result.added} code{result.added === 1 ? "" : "s"} added</div>
                  {!!result.duplicates.length && (
                    <div className="text-red-600 mt-0.5">{result.duplicates.length} duplicate{result.duplicates.length > 1 ? "s" : ""} skipped: <span className="font-mono">{result.duplicates.slice(0, 5).join(", ")}{result.duplicates.length > 5 ? "…" : ""}</span></div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
