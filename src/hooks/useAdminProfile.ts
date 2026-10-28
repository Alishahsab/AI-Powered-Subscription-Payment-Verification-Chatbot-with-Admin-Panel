"use client";

import { useEffect, useSyncExternalStore } from "react";
import { loadAdminProfile, type AdminProfile } from "@/lib/supabase/adminProfile";

let profile: AdminProfile | null = null;
let loading = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAdminProfile(next: AdminProfile | null) {
  profile = next;
  listeners.forEach((listener) => listener());
}

export function useAdminProfile() {
  const current = useSyncExternalStore(subscribe, () => profile, () => null);

  useEffect(() => {
    if (profile || loading) return;
    loading = true;
    loadAdminProfile()
      .then(setAdminProfile)
      .finally(() => (loading = false));
  }, []);

  return current;
}
