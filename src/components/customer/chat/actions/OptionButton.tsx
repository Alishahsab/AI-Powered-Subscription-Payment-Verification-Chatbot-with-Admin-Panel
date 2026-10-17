import { ChevronRight } from "lucide-react";

type OptionButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  trailing?: React.ReactNode;
};

export default function OptionButton({ onClick, children, trailing }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[var(--surface)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition text-left"
    >
      <div className="flex-1 min-w-0">{children}</div>
      {trailing ?? <ChevronRight size={16} className="text-[var(--muted)] shrink-0" />}
    </button>
  );
}
