import { classNames } from "@/lib/format";
import { whatsAppLink } from "@/lib/validation";
import WhatsAppIcon from "./WhatsAppIcon";

type WhatsAppLinkProps = {
  number: string;
  clickable?: boolean;
  className?: string;
};

export default function WhatsAppLink({ number, clickable = true, className }: WhatsAppLinkProps) {
  const content = (
    <>
      <WhatsAppIcon size={16} />
      {number}
    </>
  );

  if (!clickable) {
    return <span className={classNames("inline-flex items-center gap-1.5", className)}>{content}</span>;
  }

  return (
    <a
      href={whatsAppLink(number)}
      target="_blank"
      rel="noopener noreferrer"
      title="Open WhatsApp chat"
      className={classNames("inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline", className)}
    >
      {content}
    </a>
  );
}
