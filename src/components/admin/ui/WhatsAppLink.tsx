import { MessageCircle } from "lucide-react";
import { classNames } from "@/lib/format";
import { whatsAppLink } from "@/lib/validation";

type WhatsAppLinkProps = {
  number: string;
  text?: string;
  label?: string;
  className?: string;
};

export default function WhatsAppLink({ number, text, label, className }: WhatsAppLinkProps) {
  return (
    <a
      href={whatsAppLink(number, text)}
      target="_blank"
      rel="noopener noreferrer"
      title="Open WhatsApp chat"
      className={classNames("inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline", className)}
    >
      <MessageCircle size={14} className="shrink-0" />
      {label ?? number}
    </a>
  );
}
