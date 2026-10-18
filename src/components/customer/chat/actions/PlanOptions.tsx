import { choosePlan } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import BackToMenuButton from "./BackToMenuButton";
import OptionButton from "./OptionButton";

export default function PlanOptions({ customerId }: { customerId: string }) {
  const state = useAppState();
  const plans = state.plans.filter((plan) => plan.active);

  return (
    <div className="grid md:grid-cols-2 gap-2">
      {plans.map((plan) => (
        <OptionButton key={plan.id} onClick={() => choosePlan(customerId, plan.id)} trailing={<span className="font-bold text-[15px]">Rs {plan.price.toLocaleString()}</span>}>
          <div className="font-semibold text-[14.5px]">{plan.name}</div>
        </OptionButton>
      ))}
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
