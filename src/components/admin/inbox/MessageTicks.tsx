import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/types";

export default function MessageTicks({ message }: { message: Message }) {
  if (message.seenAt) return <CheckCheck size={14} className="text-sky-500" aria-label="Seen" />;
  if (message.deliveredAt) return <CheckCheck size={14} className="text-zinc-400" aria-label="Delivered" />;
  return <Check size={14} className="text-zinc-400" aria-label="Sent" />;
}
