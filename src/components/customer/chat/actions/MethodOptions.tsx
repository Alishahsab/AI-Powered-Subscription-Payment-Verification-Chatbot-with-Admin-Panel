import { chooseMethod } from "@/lib/store/customer";
import { useAppState } from "@/lib/store/state";
import MethodLogo from "../MethodLogo";
import BackToMenuButton from "./BackToMenuButton";
import OptionButton from "./OptionButton";

export default function MethodOptions({ customerId }: { customerId: string }) {
  const state = useAppState();
  const methods = state.methods.filter((method) => method.active);

  return (
    <div className="grid md:grid-cols-2 gap-2">
      {methods.map((method) => (
        <OptionButton key={method.id} onClick={() => chooseMethod(customerId, method.id)}>
          <div className="flex items-center gap-3">
            <MethodLogo methodId={method.id} />
            <span className="font-semibold text-[14.5px]">{method.name}</span>
          </div>
        </OptionButton>
      ))}
      <BackToMenuButton customerId={customerId} showBack />
    </div>
  );
}
