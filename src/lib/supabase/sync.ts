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

const LOCAL_WRITE_WINDOW_MS = 5000;
const recentLocalWrites = new Map<string, { at: number; columns: Set<string> }>();

function rememberLocalWrite(tableName: string, row: Row, key: string) {
  const id = `${tableName}:${row[key]}`;
  const previous = recentLocalWrites.get(id);
  const columns = previous && Date.now() - previous.at < LOCAL_WRITE_WINDOW_MS ? previous.columns : new Set<string>();
  for (const column of Object.keys(row)) if (column !== key) columns.add(column);
  recentLocalWrites.set(id, { at: Date.now(), columns });
}

// Columns this client wrote in the last few seconds. Their echoes can be older than local state, so they are ignored.
function recentlyWrittenColumns(tableName: string, id: string) {
  const write = recentLocalWrites.get(`${tableName}:${id}`);
  return write && Date.now() - write.at < LOCAL_WRITE_WINDOW_MS ? write.columns : null;
}

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

type TableChanges = {
  table: TableSync;
  inserted: Row[];
  updated: Row[];
  deletedIds: string[];
};

function findTableChanges(table: TableSync, before: AppState, after: AppState): TableChanges {
  const oldRows = rowsById(table.readRows(before), table.key);
  const newRows = table.readRows(after);

  const inserted = newRows.filter((row) => !oldRows.has(String(row[table.key])));

  // Send only the columns that changed, so a write never overwrites what someone else changed in another column.
  const updated: Row[] = [];
  for (const row of newRows) {
    const previous = oldRows.get(String(row[table.key]));
    if (previous === undefined || previous === JSON.stringify(row)) continue;
    const before = JSON.parse(previous) as Row;
    const changed: Row = { [table.key]: row[table.key] };
    for (const [column, value] of Object.entries(row)) {
      if (JSON.stringify(value) !== JSON.stringify(before[column])) changed[column] = value;
    }
    updated.push(changed);
  }

  const newIds = new Set(newRows.map((row) => String(row[table.key])));
  const deletedIds = [...oldRows.keys()].filter((id) => !newIds.has(id));

  return { table, inserted, updated, deletedIds };
}

async function writeTableChanges(client: SupabaseClient, changes: TableChanges) {
  const { table, inserted, updated, deletedIds } = changes;

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

function handleLocalChange(before: AppState, after: AppState) {
  const changes = tables.map((table) => findTableChanges(table, before, after));

  for (const change of changes) {
    for (const row of [...change.inserted, ...change.updated]) {
      rememberLocalWrite(change.table.name, row, change.table.key);
    }
  }

  const configChanged = JSON.stringify(pickConfig(before)) !== JSON.stringify(pickConfig(after));
  const config = pickConfig(after);

  pushQueue = pushQueue.then(async () => {
    const client = getActiveClient();
    for (const change of changes) await writeTableChanges(client, change);

    if (configChanged && activeRole === "admin") {
      const { error } = await client.from("store_config").upsert(configToRow(config));
      if (error) console.error("Saving settings failed", error.message);
    }
  });
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
        return;
      }

      const row = payload.new as Row;
      const ownColumns = recentlyWrittenColumns(table.name, String(row[table.key]));
      if (!ownColumns) {
        applyRemoteChange((draft) => table.apply(draft, row));
        return;
      }

      // Keep our own recent values, but take every column someone else changed.
      applyRemoteChange((draft) => {
        const local = table.readRows(draft).find((item) => String(item[table.key]) === String(row[table.key]));
        if (!local) return table.apply(draft, row);
        const merged: Row = { ...row };
        for (const column of ownColumns) if (column in local) merged[column] = local[column];
        table.apply(draft, merged);
        table.applyServerFields?.(draft, row);
      });
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
  setChangeHandler(handleLocalChange);
  listenForChanges(client);
}

export async function stopSync() {
  setChangeHandler(null);
  if (channel && activeRole) await getSupabase(activeRole).removeChannel(channel);
  channel = null;
  activeRole = null;
  clearState();
}
