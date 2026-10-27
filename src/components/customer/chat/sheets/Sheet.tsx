import { X } from "lucide-react";
import { useBackButton } from "@/hooks/useBackButton";

type SheetProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Sheet({ title, subtitle, onClose, children }: SheetProps) {
  useBackButton(true, onClose);
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end md:justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40 fade-in" onClick={onClose} />
      <div className="sheet-up relative bg-[var(--surface)] rounded-t-[26px] md:rounded-3xl border-t md:border border-[var(--line)] px-5 md:px-7 pt-3 md:pt-6 pb-6 max-h-[92%] md:w-full md:max-w-[520px] overflow-y-auto shadow-2xl">
        <div className="mx-auto w-10 h-1 rounded-full bg-black/15 mb-4 md:hidden" />
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-[18px]">{title}</div>
            {subtitle && <div className="text-[13px] text-[var(--muted)] mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="size-9 grid place-items-center rounded-full hover:bg-black/5 -mr-2" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
