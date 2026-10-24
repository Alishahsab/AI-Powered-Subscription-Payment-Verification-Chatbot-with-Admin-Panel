import { Ban, Check, Clock3 } from "lucide-react";
import BrandIcon from "@/components/BrandIcon";
import StoredImage from "@/components/StoredImage";
import { usePendingMessages } from "@/hooks/usePendingMessages";
import { formatTime } from "@/lib/format";
import type { Message } from "@/lib/types";
import CodeCard from "./cards/CodeCard";
import CodeInstructionsCard from "./cards/CodeInstructionsCard";
import PaymentCard from "./cards/PaymentCard";
import ProofCard from "./cards/ProofCard";
import WalletStepsCard from "./cards/WalletStepsCard";

type MessageItemProps = {
  message: Message;
  startsGroup: boolean;
};

export default function MessageItem({ message, startsGroup }: MessageItemProps) {
  const fromCustomer = message.sender === "customer";

  return (
    <div className={`rise-in ${startsGroup ? "pt-2.5" : ""}`}>
      {fromCustomer ? (
        <div className="flex justify-end">
          <div className="max-w-[82%] md:max-w-[68%]">
            <MessageContent message={message} />
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="w-7 shrink-0">{startsGroup && <BrandIcon size={28} className="rounded-lg" />}</div>
          <div className="max-w-[82%] md:max-w-[68%] min-w-0">
            {startsGroup && message.sender === "admin" && <div className="text-[11.5px] text-[var(--accent)] font-semibold mb-1 ml-1">Premium Store Team</div>}
            <MessageContent message={message} />
          </div>
        </div>
      )}
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  if (message.kind === "payment") return <PaymentCard message={message} />;
  if (message.kind === "steps") return <WalletStepsCard message={message} />;
  if (message.kind === "proof") return <ProofCard message={message} />;
  if (message.kind === "image") return <ImageBubble message={message} />;
  if (message.kind === "instructions") return <CodeInstructionsCard message={message} />;
  if (message.kind === "code") return <CodeCard message={message} />;
  if (message.kind === "deleted") return <DeletedBubble message={message} />;
  return <TextBubble message={message} />;
}

function TextBubble({ message }: { message: Message }) {
  const styles = {
    customer: "bg-[var(--accent)] text-[var(--accent-ink)] rounded-br-md",
    admin: "bg-[var(--surface-2)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] rounded-bl-md",
    bot: "bg-[var(--surface)] border border-[var(--line)] rounded-bl-md",
  };
  const timeColor = message.sender === "customer" ? "text-[var(--accent-ink)]/60" : "text-[var(--muted)]";

  return (
    <div className={`px-3.5 pt-2 pb-1.5 rounded-2xl text-[15.5px] md:text-[16px] leading-[1.55] whitespace-pre-line ${styles[message.sender]}`}>
      {message.text}
      <span className={`ml-2 inline-flex items-center gap-0.5 translate-y-0.5 text-[10.5px] ${timeColor}`}>
        {formatTime(message.createdAt)}
        {message.sender === "customer" && <SendState id={message.id} />}
      </span>
    </div>
  );
}

// Like a chat app: a clock while the message waits for the connection, a tick once the server has it.
function SendState({ id }: { id: string }) {
  const pending = usePendingMessages().has(id);
  return pending ? <Clock3 size={11} aria-label="Waiting to send" /> : <Check size={12} aria-label="Sent" />;
}

function DeletedBubble({ message }: { message: Message }) {
  return (
    <div className="px-3.5 pt-2 pb-1.5 rounded-2xl rounded-bl-md border border-dashed border-[var(--line)] text-[14.5px] italic text-[var(--muted)] flex items-center gap-1.5">
      <Ban size={14} className="shrink-0" /> This message has been deleted
      <span className="ml-1 not-italic text-[10.5px]">{formatTime(message.createdAt)}</span>
    </div>
  );
}

function ImageBubble({ message }: { message: Message }) {
  const fromTeam = message.sender === "admin";

  return (
    <div className={`w-[260px] rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--surface)] ${fromTeam ? "rounded-bl-md" : "rounded-br-md"}`}>
      {message.image && <StoredImage zoomable path={message.image} alt={fromTeam ? "Image from our team" : "Attached screenshot"} className={`w-full ${fromTeam ? "max-h-80 object-contain bg-black/[0.03]" : "h-44 object-cover object-top"}`} />}
      <div className="px-3 py-2 text-[11.5px] text-[var(--muted)]">
        {fromTeam ? "Image" : "Screenshot"} · {formatTime(message.createdAt)}
      </div>
    </div>
  );
}
