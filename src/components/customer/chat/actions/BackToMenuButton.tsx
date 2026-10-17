import { ArrowLeft, LayoutGrid } from "lucide-react";
import { backToMenu, goBack } from "@/lib/store/customer";

type BackToMenuButtonProps = {
  customerId: string;
  showBack?: boolean;
};

const buttonClass =
  "h-11 px-5 rounded-full border-2 border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] text-[var(--accent)] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] hover:border-[var(--accent)] transition";

export default function BackToMenuButton({ customerId, showBack = false }: BackToMenuButtonProps) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 md:col-span-2">
      {showBack && (
        <button onClick={() => goBack(customerId)} className={buttonClass}>
          <ArrowLeft size={16} /> Back
        </button>
      )}
      <button onClick={() => backToMenu(customerId)} className={buttonClass}>
        <LayoutGrid size={16} /> Main menu
      </button>
    </div>
  );
}
