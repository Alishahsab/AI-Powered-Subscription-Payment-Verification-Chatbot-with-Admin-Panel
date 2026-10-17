import { LifeBuoy, ShoppingBag } from "lucide-react";
import { chooseMenuOption, menuLabels, type MenuOption } from "@/lib/store/customer";

const options: { key: MenuOption; icon: React.ReactNode; description: string; primary: boolean }[] = [
  { key: "buy", icon: <ShoppingBag size={22} />, description: "Plans, payment and your code", primary: true },
  { key: "support", icon: <LifeBuoy size={22} />, description: "Questions or a problem with your code", primary: false },
];

export default function MenuOptions({ customerId }: { customerId: string }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:gap-3">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => chooseMenuOption(customerId, option.key)}
          className={
            option.primary
              ? "text-left rounded-2xl p-4 bg-[var(--accent)] text-[var(--accent-ink)] transition hover:brightness-110"
              : "text-left rounded-2xl p-4 bg-[var(--surface)] border-2 border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition"
          }
        >
          <div className={option.primary ? "text-[var(--gold)]" : "text-[var(--accent)]"}>{option.icon}</div>
          <div className="mt-2.5 font-semibold text-[15px] md:text-[16px] leading-tight">{menuLabels[option.key]}</div>
          <div className={`text-[12.5px] mt-1 ${option.primary ? "opacity-75" : "text-[var(--muted)]"}`}>{option.description}</div>
        </button>
      ))}
    </div>
  );
}
