import { useState } from "react";
import { formatDateTime, formatTime } from "@/lib/format";

// Shows the time; hovering (or tapping on a phone) shows the full date as well.
export default function MessageTime({ time }: { time: number }) {
  const [showDate, setShowDate] = useState(false);
  return (
    <button type="button" onClick={() => setShowDate((shown) => !shown)} title={formatDateTime(time)} className="hover:text-zinc-600">
      {showDate ? formatDateTime(time) : formatTime(time)}
    </button>
  );
}
