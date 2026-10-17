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
