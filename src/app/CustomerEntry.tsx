"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const CustomerApp = dynamic(() => import("@/components/customer/CustomerApp"), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[#eceef2]" />,
});

export default function CustomerEntry() {
  // Lets a signed-in customer open the chat without internet (see public/sw.js).
  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  return <CustomerApp />;
}
