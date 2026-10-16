"use client";

import dynamic from "next/dynamic";

const CustomerApp = dynamic(() => import("@/components/customer/CustomerApp"), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[#eceef2]" />,
});

export default function CustomerEntry() {
  return <CustomerApp />;
}
