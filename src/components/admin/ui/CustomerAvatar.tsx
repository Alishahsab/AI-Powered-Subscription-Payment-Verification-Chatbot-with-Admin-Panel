import { X } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { useAppState } from "@/lib/store/state";
import { customerStatus, statusColors } from "../customerStatus";
import Avatar from "./Avatar";

const GAP_DEGREES = 10;

function point(center: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return `${center + radius * Math.cos(radians)} ${center + radius * Math.sin(radians)}`;
}

function arc(center: number, radius: number, from: number, to: number) {
  return `M ${point(center, radius, from + GAP_DEGREES / 2)} A ${radius} ${radius} 0 0 1 ${point(center, radius, to - GAP_DEGREES / 2)}`;
}

export default function CustomerAvatar({ customerId, size = 40 }: { customerId: string; size?: number }) {
  const state = useAppState();
  const now = useNow(30_000);
  const customer = state.customers.find((item) => item.id === customerId);
  const status = customerStatus(state, customerId, now);

  const ring = Math.max(3, Math.round(size * 0.09));
  const outer = size + ring * 2 + 4;
  const center = outer / 2;
  const radius = center - ring / 2;
  const badge = Math.max(12, Math.round(size * 0.32));

  const quarters = [
    { from: 0, to: 90, color: status.order ? statusColors[status.order] : null },
    { from: 90, to: 180, color: null },
    { from: 180, to: 270, color: status.appIssue ? statusColors.appIssue : null },
    { from: 270, to: 360, color: status.completion ? statusColors[status.completion] : null },
  ];

  return (
    <div className="relative shrink-0" style={{ width: outer, height: outer }}>
      <svg width={outer} height={outer} className="absolute inset-0" aria-hidden="true">
        {quarters.map((quarter) => (
          <path
            key={quarter.from}
            d={arc(center, radius, quarter.from, quarter.to)}
            fill="none"
            stroke={quarter.color ?? "currentColor"}
            strokeWidth={ring}
            strokeLinecap="round"
            className={quarter.color ? undefined : "text-zinc-200"}
          />
        ))}
      </svg>
      <div className="absolute grid place-items-center" style={{ inset: ring + 2 }}>
        <Avatar name={customer?.email ?? "?"} size={size} />
      </div>
      <span
        className="absolute bottom-0 right-0 rounded-full ring-2 ring-white"
        style={{ width: badge * 0.75, height: badge * 0.75, background: status.active ? statusColors.activeChat : statusColors.inactiveChat }}
        title={status.active ? "Active chat" : "Inactive chat"}
      />
      {status.blocked && (
        <span className="absolute bottom-0 left-0 rounded-full grid place-items-center text-white ring-2 ring-white" style={{ width: badge, height: badge, background: statusColors.blocked }} title="Blocked">
          <X size={badge * 0.7} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
