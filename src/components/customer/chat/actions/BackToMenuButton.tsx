import { LayoutGrid } from "lucide-react";
import { backToMenu } from "@/lib/store/customer";

export default function BackToMenuButton({ customerId }: { customerId: string }) {
  return (
    <button
      onClick={() => backToMenu(customerId)}
      className="mt-2 h-11 px-5 rounded-full border-2 border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] text-[var(--accent)] text-[14px] font-semibold flex items-center justify-center gap-2 mx-auto md:col-span-2 w-fit hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] hover:border-[var(--accent)] transition"
    >
      <LayoutGrid size={16} /> Back to main menu
    </button>
  );
}
