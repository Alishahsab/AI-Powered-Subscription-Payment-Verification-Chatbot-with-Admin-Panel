"use client";

import { useEffect } from "react";
import { expireUnpaidOrders } from "@/lib/store/customer";

export function useOrderExpiry() {
  useEffect(() => {
    expireUnpaidOrders();
    const timer = setInterval(expireUnpaidOrders, 2000);
    return () => clearInterval(timer);
  }, []);
}
