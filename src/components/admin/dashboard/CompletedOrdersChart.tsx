"use client";

import { useState } from "react";
import { classNames } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import { Card, CardHeader } from "../ui/Card";

const DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;
const LINE_COLOR = "#0C2660";

// Points sit inside the plot with a little side padding so the end dots are not clipped.
const xPercent = (index: number) => 4 + (index / (DAYS - 1)) * 92;

export default function CompletedOrdersChart({ now }: { now: number }) {
  const state = useAppState();
  const [active, setActive] = useState<number | null>(null);

  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const days = Array.from({ length: DAYS }, (_, index) => {
    const start = startOfToday - (DAYS - 1 - index) * DAY;
    const count = state.orders.filter((order) => order.status === "completed" && (order.reviewedAt ?? 0) >= start && (order.reviewedAt ?? 0) < start + DAY).length;
    const date = new Date(start);
    return {
      count,
      short: date.toLocaleDateString("en-GB", { weekday: "short" }),
      full: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
    };
  });

  const total = days.reduce((sum, day) => sum + day.count, 0);
  const top = Math.max(4, Math.ceil(Math.max(...days.map((day) => day.count)) / 2) * 2);
  const yPercent = (count: number) => 100 - (count / top) * 100;
  const points = days.map((day, index) => `${xPercent(index)},${yPercent(day.count)}`).join(" ");

  return (
    <Card>
      <CardHeader title="Completed orders" description={`Last 7 days · ${total} completed`} />
      <div className="px-5 pb-4">
        <div className="relative h-52 ml-7 mb-6">
          {[0, 0.5, 1].map((fraction) => (
            <div key={fraction} className="absolute inset-x-0 border-t border-zinc-100" style={{ top: `${fraction * 100}%` }}>
              <span className="absolute -left-7 -translate-y-1/2 w-5 text-right text-[11px] text-zinc-400 tabular-nums">{Math.round(top * (1 - fraction))}</span>
            </div>
          ))}

          {active !== null && <div className="absolute top-0 bottom-0 border-l border-zinc-300" style={{ left: `${xPercent(active)}%` }} />}

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <polyline points={points} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {days.map((day, index) => (
            <span
              key={index}
              className={classNames("absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", active === index && "size-2.5")}
              style={{ left: `${xPercent(index)}%`, top: `${yPercent(day.count)}%`, background: LINE_COLOR }}
            />
          ))}

          {days.map((day, index) => (
            <button
              key={index}
              type="button"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(index)}
              className="absolute top-0 bottom-0 -translate-x-1/2"
              style={{ left: `${xPercent(index)}%`, width: `${100 / DAYS}%` }}
              aria-label={`${day.full}: ${day.count} completed`}
            />
          ))}

          {active !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full -mt-3 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[12px] text-white shadow-lg"
              style={{ left: `${Math.min(88, Math.max(12, xPercent(active)))}%`, top: `${yPercent(days[active].count)}%` }}
            >
              <div className="text-white/60">{days[active].full}</div>
              <div className="font-semibold">{days[active].count} completed</div>
            </div>
          )}

          {days.map((day, index) => (
            <span key={index} className="absolute top-full mt-2 -translate-x-1/2 text-[11px] text-zinc-500" style={{ left: `${xPercent(index)}%` }}>
              {index === DAYS - 1 ? "Today" : day.short}
            </span>
          ))}
        </div>

        <table className="sr-only">
          <caption>Completed orders per day, last 7 days</caption>
          <tbody>
            {days.map((day, index) => (
              <tr key={index}>
                <th scope="row">{day.full}</th>
                <td>{day.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
