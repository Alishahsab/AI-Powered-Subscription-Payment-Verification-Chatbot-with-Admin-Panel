"use client";

import dynamic from "next/dynamic";

const ResetPinScreen = dynamic(() => import("@/components/customer/ResetPinScreen"), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[#eceef2]" />,
});

export default function ResetPinEntry() {
  return <ResetPinScreen />;
}
