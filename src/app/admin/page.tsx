"use client";

import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/components/admin/AdminApp"), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[#f5f6f8]" />,
});

export default function Page() {
  return <AdminApp />;
}
