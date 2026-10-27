import { X } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { useAppState } from "@/lib/store/state";
import { customerStatus, statusColors } from "../customerStatus";
import Avatar from "./Avatar";

const GAP_DEGREES = 3;

function point(center: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return `${center + radius * Math.cos(radians)} ${center + radius * Math.sin(radians)}`;
}

function arc(center: number, radius: number, from: number, to: number) {
  return `M ${point(center, radius, from + GAP_DEGREES / 2)} A ${radius} ${radius} 0 0 1 ${point(center, radius, to - GAP_DEGREES / 2)}`;
}

export default function CustomerAvatar({ customerId, size = 52 }: { customerId: string; size?: number }) {
  const state = useAppState();
  const now = useNow(30_000);
  const customer = state.customers.find((item) => item.id === customerId);
  const status = customerStatus(state, customerId, now);

  const ring = Math.round(size * 0.17);
  const center = size / 2;
  const radius = center - ring / 2;
  const avatar = size - ring * 2 - 2;
  const cross = Math.round(size * 0.36);
  const dot = Math.round(size * 0.22);

  const quarters = [
    { from: 0, to: 90, color: status.order ? statusColors[status.order] : null },
    { from: 90, to: 180, color: null },
    { from: 180, to: 270, color: status.appIssue ? statusColors.appIssue : null },
    { from: 270, to: 360, color: status.completion ? statusColors[status.completion] : null },
  ];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0" aria-hidden="true">
        {quarters.map((quarter) => (
          <path
            key={quarter.from}
            d={arc(center, radius, quarter.from, quarter.to)}
            fill="none"
            stroke={quarter.color ?? "currentColor"}
            strokeWidth={ring}
            className={quarter.color ? undefined : "text-zinc-200"}
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <Avatar name={customer?.email ?? "?"} size={avatar} />
      </div>
      <span
        className="absolute rounded-full ring-2 ring-white"
        style={{ width: dot, height: dot, right: 0, bottom: 0, background: status.active ? statusColors.activeChat : statusColors.inactiveChat }}
        title={status.active ? "Active chat" : "Inactive chat"}
      />
      {status.blocked && (
        <span
          className="absolute rounded-full grid place-items-center text-white ring-2 ring-white"
          style={{ width: cross, height: cross, left: size * 0.12, bottom: -size * 0.02, background: statusColors.blocked }}
          title="Blocked"
        >
          <X size={cross * 0.65} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
