import { Landmark } from "lucide-react";
import { classNames } from "@/lib/format";

const logos: Record<string, string> = {
  jazzcash: "/payments/jazzcash.webp",
  easypaisa: "/payments/easypaisa.jpg",
  nayapay: "/payments/nayapay.jpg",
};

export default function MethodLogo({ methodId, className }: { methodId: string; className?: string }) {
  const logo = logos[methodId];

  return (
    <span className={classNames("size-10 rounded-xl bg-white border border-[var(--line)] grid place-items-center overflow-hidden shrink-0", className)}>
      {logo ? <img src={logo} alt="" className="size-full object-contain p-1" draggable={false} /> : <Landmark size={18} className="text-[var(--accent)]" />}
    </span>
  );
}
