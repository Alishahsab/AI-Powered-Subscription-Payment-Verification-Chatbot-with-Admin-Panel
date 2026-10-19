import { backToMenu, goBack } from "@/lib/store/customer";

type BackToMenuButtonProps = {
  customerId: string;
  showBack?: boolean;
};

const buttonClass =
  "h-9 px-4 rounded-full text-[var(--accent)] text-[13.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] transition";

export default function BackToMenuButton({ customerId, showBack = false }: BackToMenuButtonProps) {
  return (
    <div className="mt-1 flex items-center justify-center gap-1 md:col-span-2">
      {showBack && (
        <>
          <button onClick={() => goBack(customerId)} className={buttonClass}>
            Back
          </button>
          <span className="h-4 w-px bg-[var(--line)]" />
        </>
      )}
      <button onClick={() => backToMenu(customerId)} className={buttonClass}>
        Main menu
      </button>
    </div>
  );
}
