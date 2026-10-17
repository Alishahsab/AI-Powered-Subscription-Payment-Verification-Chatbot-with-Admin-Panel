import { choosePlan } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import BackToMenuButton from "./BackToMenuButton";
import OptionButton from "./OptionButton";

export default function PlanOptions({ customerId }: { customerId: string }) {
  const state = useAppState();
  const plans = state.plans.filter((plan) => plan.active);
  const monthlyPrice = plans.find((plan) => plan.months === 1)?.price ?? 0;

  return (
    <div className="grid md:grid-cols-2 gap-2">
      {plans.map((plan) => {
        const fullPrice = monthlyPrice * plan.months;
        const savings = plan.months > 1 && fullPrice > 0 ? Math.round((1 - plan.price / fullPrice) * 100) : 0;

        return (
          <OptionButton key={plan.id} onClick={() => choosePlan(customerId, plan.id)} trailing={<span className="font-bold text-[15px]">Rs {plan.price.toLocaleString()}</span>}>
            <div className="font-semibold text-[14.5px]">{plan.name}</div>
            <div className="text-[12px] text-[var(--muted)]">
              Rs {Math.round(plan.price / plan.months)}/month
              {savings > 0 && ` · save ${savings}%`}
            </div>
          </OptionButton>
        );
      })}
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
