import BackToMenuButton from "./BackToMenuButton";

// The How to use and Instructions for next time buttons live on the code card itself.
export default function CodeDeliveredActions({ customerId }: { customerId: string }) {
  return (
    <div className="max-w-[560px] mx-auto">
      <BackToMenuButton customerId={customerId} />
    </div>
  );
}
