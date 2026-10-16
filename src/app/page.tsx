"use client";

import dynamic from "next/dynamic";

const CustomerApp = dynamic(() => import("@/components/customer/CustomerApp"), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[#08090b]" />,
});

export default function Page() {
  return <CustomerApp />;
}
