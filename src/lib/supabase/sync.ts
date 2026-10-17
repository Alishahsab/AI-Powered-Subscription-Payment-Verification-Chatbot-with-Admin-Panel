import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { applyRemoteChange, clearState, getState, setChangeHandler } from "../store/state";
import type { AppState, StoreConfig } from "../types";
import { getSupabase, type AppRole } from "./client";
import { configFromRow, configToRow } from "./mappers";
import { tables, type TableSync } from "./tables";

type Row = Record<string, unknown>;

let activeRole: AppRole | null = null;
let channel: RealtimeChannel | null = null;
let pushQueue: Promise<void> = Promise.resolve();

export function getActiveClient() {
  if (!activeRole) throw new Error("Data sync has not started");
  return getSupabase(activeRole);
}

function pickConfig(state: AppState): StoreConfig {
  return { settings: state.settings, plans: state.plans, methods: state.methods, faqs: state.faqs };
}

function rowsById(rows: Row[], key: string) {
  return new Map(rows.map((row) => [String(row[key]), JSON.stringify(row)]));
}

async function pushTableChanges(client: SupabaseClient, table: TableSync, before: AppState, after: AppState) {
  const oldRows = rowsById(table.readRows(before), table.key);
  const newRows = table.readRows(after);

  const inserted = newRows.filter((row) => !oldRows.has(String(row[table.key])));
  const updated = newRows.filter((row) => {
    const previous = oldRows.get(String(row[table.key]));
    return previous !== undefined && previous !== JSON.stringify(row);
  });

  const newIds = new Set(newRows.map((row) => String(row[table.key])));
  const deletedIds = [...oldRows.keys()].filter((id) => !newIds.has(id));

  if (inserted.length > 0) {
    const { error } = await client.from(table.name).insert(inserted);
    if (error) console.error(`Insert into ${table.name} failed`, error.message);
  }

  for (const row of updated) {
    const { error } = await client.from(table.name).update(row).eq(table.key, row[table.key]);
    if (error) console.error(`Update of ${table.name} failed`, error.message);
  }

  if (deletedIds.length > 0 && activeRole === "admin") {
    const { error } = await client.from(table.name).delete().in(table.key, deletedIds);
    if (error) console.error(`Delete from ${table.name} failed`, error.message);
  }
}

async function pushChanges(before: AppState, after: AppState) {
  const client = getActiveClient();

  for (const table of tables) {
    await pushTableChanges(client, table, before, after);
  }

  const configChanged = JSON.stringify(pickConfig(before)) !== JSON.stringify(pickConfig(after));
  if (configChanged && activeRole === "admin") {
    const { error } = await client.from("store_config").upsert(configToRow(pickConfig(after)));
    if (error) console.error("Saving settings failed", error.message);
  }
}

async function loadEverything(client: SupabaseClient) {
  const results = await Promise.all(tables.map((table) => client.from(table.name).select("*")));
  const config = await client.from("store_config").select("*").maybeSingle();

  applyRemoteChange((draft) => {
    tables.forEach((table, index) => table.replaceAll(draft, results[index].data ?? []));
    if (config.data) Object.assign(draft, configFromRow(config.data));
    draft.loaded = true;
  });

  if (!config.data && activeRole === "admin") {
    await client.from("store_config").insert(configToRow(pickConfig(getState())));
  }
}

function listenForChanges(client: SupabaseClient) {
  channel = client.channel("premium-store-data");

  for (const table of tables) {
    channel.on("postgres_changes", { event: "*", schema: "public", table: table.name }, (payload) => {
      if (payload.eventType === "DELETE") {
        const id = String((payload.old as Row)[table.key]);
        applyRemoteChange((draft) => table.remove(draft, id));
      } else {
        applyRemoteChange((draft) => table.apply(draft, payload.new as Row));
      }
    });
  }

  channel.on("postgres_changes", { event: "*", schema: "public", table: "store_config" }, (payload) => {
    if (payload.eventType === "DELETE") return;
    applyRemoteChange((draft) => Object.assign(draft, configFromRow(payload.new as Row)));
  });

  channel.subscribe();
}

export async function startSync(role: AppRole) {
  if (activeRole === role) return;
  await stopSync();

  activeRole = role;
  const client = getSupabase(role);
  await loadEverything(client);
  setChangeHandler((before, after) => {
    pushQueue = pushQueue.then(() => pushChanges(before, after));
  });
  listenForChanges(client);
}

export async function stopSync() {
  setChangeHandler(null);
  if (channel && activeRole) await getSupabase(activeRole).removeChannel(channel);
  channel = null;
  activeRole = null;
  clearState();
}
