"use client";

import { useState } from "react";
import { classNames } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import { Card, CardHeader } from "../ui/Card";

const DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;
const BAR_COLOR = "#0C2660";

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
      short: index === DAYS - 1 ? "Today" : date.toLocaleDateString("en-GB", { weekday: "short" }),
      full: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
    };
  });

  const total = days.reduce((sum, day) => sum + day.count, 0);
  const top = Math.max(4, Math.ceil(Math.max(...days.map((day) => day.count)) / 2) * 2);

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

          <div className="absolute inset-0 flex">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(index)}
                className="relative flex-1 h-full flex items-end justify-center"
                aria-label={`${day.full}: ${day.count} completed`}
              >
                <span
                  className={classNames("w-[42%] max-w-8 rounded-t transition-opacity", active !== null && active !== index && "opacity-40")}
                  style={{ height: `${(day.count / top) * 100}%`, minHeight: day.count > 0 ? 3 : 0, background: BAR_COLOR }}
                />
                <span className="absolute top-full mt-2 text-[11px] text-zinc-500">{day.short}</span>
                {active === index && (
                  <span
                    className="pointer-events-none absolute z-10 left-1/2 -translate-x-1/2 -translate-y-full -mt-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-left text-[12px] text-white shadow-lg"
                    style={{ bottom: `${(day.count / top) * 100}%` }}
                  >
                    <span className="block text-white/60">{day.full}</span>
                    <span className="block font-semibold">{day.count} completed</span>
                  </span>
                )}
              </button>
            ))}
          </div>
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
