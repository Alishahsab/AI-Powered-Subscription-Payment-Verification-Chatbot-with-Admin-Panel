import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "customer" | "admin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

const clients: Partial<Record<AppRole, SupabaseClient>> = {};

export function getSupabase(role: AppRole) {
  if (!clients[role]) {
    clients[role] = createClient(url, key, {
      auth: { storageKey: `premium-store-${role}`, persistSession: true, autoRefreshToken: true },
    });
  }
  return clients[role];
}

// A short-lived client that keeps no session, used to reset the admin password
// without signing the admin panel in halfway through.
export function createTemporaryClient() {
  return createClient(url, key, {
    auth: { storageKey: "premium-store-reset", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
