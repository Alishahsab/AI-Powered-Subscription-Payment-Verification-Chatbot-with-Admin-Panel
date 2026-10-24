"use client";

import { useSyncExternalStore } from "react";
import { pendingMessageIds, pendingSnapshot, subscribePending } from "@/lib/supabase/sync";

// Ids of messages the server does not have yet.
export function usePendingMessages() {
  useSyncExternalStore(subscribePending, pendingSnapshot, () => 0);
  return pendingMessageIds();
}
