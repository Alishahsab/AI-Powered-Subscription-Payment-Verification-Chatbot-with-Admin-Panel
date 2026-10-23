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

// Our own changes are protected from older echoes for this long after the server confirmed them,
// so a slow mobile connection cannot bring back an earlier chat step.
const LOCAL_WRITE_WINDOW_MS = 10_000;
const recentLocalWrites = new Map<string, { at: number; columns: Set<string> }>();

// Empty columns of a new row are not ours to keep: the other side fills them in (delivered and seen ticks).
function rememberLocalWrite(tableName: string, row: Row, key: string, inserted: boolean) {
  const id = `${tableName}:${row[key]}`;
  const previous = recentLocalWrites.get(id);
  const columns = previous && Date.now() - previous.at < LOCAL_WRITE_WINDOW_MS ? previous.columns : new Set<string>();
  for (const [column, value] of Object.entries(row)) {
    if (column !== key && !(inserted && value == null)) columns.add(column);
  }
  recentLocalWrites.set(id, { at: Date.now(), columns });
}

// The window starts again once the server has the change, however long the request took.
function refreshLocalWrite(tableName: string, id: string) {
  const write = recentLocalWrites.get(`${tableName}:${id}`);
  if (write) write.at = Date.now();
}

// Columns this client wrote in the last few seconds. Their echoes can be older than local state, so they are ignored.
function recentlyWrittenColumns(tableName: string, id: string) {
  const write = recentLocalWrites.get(`${tableName}:${id}`);
  return write && Date.now() - write.at < LOCAL_WRITE_WINDOW_MS ? write.columns : null;
}

// Counts local changes, so a reload that raced with a tap is thrown away instead of undoing the tap.
let localVersion = 0;

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
    refreshLocalWrite(table.name, String(row[table.key]));
  }

  if (deletedIds.length > 0 && activeRole === "admin") {
    const { error } = await client.from(table.name).delete().in(table.key, deletedIds);
    if (error) console.error(`Delete from ${table.name} failed`, error.message);
  }
}

function handleLocalChange(before: AppState, after: AppState) {
  const changes = tables.map((table) => findTableChanges(table, before, after));
  localVersion += 1;

  for (const change of changes) {
    for (const row of change.inserted) rememberLocalWrite(change.table.name, row, change.table.key, true);
    for (const row of change.updated) rememberLocalWrite(change.table.name, row, change.table.key, false);
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

const PAGE_SIZE = 1000;

// Supabase returns at most 1000 rows per request, so larger tables are read page by page.
async function fetchAllRows(client: SupabaseClient, table: TableSync, messagesSince?: number) {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table.name).select("*");
    if (messagesSince !== undefined && table.name === "messages") query = query.gt("created_at", messagesSince);
    const { data, error } = await query.order(table.key).range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}

// With messagesSince, only newer messages are read; older ones on screen are kept as they are.
async function fetchEverything(client: SupabaseClient, messagesSince?: number) {
  const results = await Promise.all(tables.map((table) => fetchAllRows(client, table, messagesSince)));
  const config = await client.from("store_config").select("*").maybeSingle();
  return { results, config, messagesSince };
}

async function loadEverything(client: SupabaseClient) {
  await applyEverything(client, await fetchEverything(client));
}

async function applyEverything(client: SupabaseClient, { results, config, messagesSince }: Awaited<ReturnType<typeof fetchEverything>>) {
  applyRemoteChange((draft) => {
    // A table that failed to load keeps what is on screen instead of being emptied.
    tables.forEach((table, index) => {
      const rows = results[index].data;
      if (!rows) return;
      if (messagesSince !== undefined && table.name === "messages") {
        const older = table.readRows(draft).filter((row) => Number(row.created_at) <= messagesSince);
        table.replaceAll(draft, [...older, ...rows]);
      } else {
        table.replaceAll(draft, rows);
      }
    });
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

  let subscribedBefore = false;
  channel.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    if (subscribedBefore) void catchUp();
    subscribedBefore = true;
  });
}

const CATCH_UP_AFTER_HIDDEN_MS = 10_000;
let hiddenSince = 0;

// A phone can lose the live connection without saying so, even with the panel on screen.
// The admin panel therefore refreshes every minute; messages only for the last 30 minutes to keep it light.
const ADMIN_REFRESH_MS = 60_000;
const ADMIN_REFRESH_MESSAGES_MS = 30 * 60_000;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

// Events sent while the connection was down are not replayed, so reload everything once.
// A reload that overlapped a local change is older than the screen, so it is retried.
async function catchUp(recentMessagesOnly = false) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!activeRole) return;
    await pushQueue;
    const version = localVersion;
    const client = getActiveClient();
    // Right after a phone wakes the tab, the sign-in may not be refreshed yet. A reload without it comes back
    // empty or half loaded, so what is on screen is kept and the next return tries again.
    const { data: auth } = await client.auth.getSession();
    if (!auth.session) return;
    const data = await fetchEverything(client, recentMessagesOnly ? Date.now() - ADMIN_REFRESH_MESSAGES_MS : undefined);
    if (!activeRole || !looksComplete(data)) return;
    if (version === localVersion) return applyEverything(client, data);
  }
}

// Every table loaded, and the customers did not vanish (which only happens when the request was not signed in).
function looksComplete({ results }: Awaited<ReturnType<typeof fetchEverything>>) {
  if (results.some((result) => result.error || !result.data)) return false;
  const customers = results[tables.findIndex((table) => table.name === "customers")]?.data ?? [];
  return customers.length > 0 || getState().customers.length === 0;
}

function handleVisibility() {
  if (document.visibilityState === "hidden") {
    hiddenSince = Date.now();
    return;
  }
  if (hiddenSince && Date.now() - hiddenSince > CATCH_UP_AFTER_HIDDEN_MS) void catchUp();
  hiddenSince = 0;
}

export async function startSync(role: AppRole) {
  if (activeRole === role) return;
  await stopSync();

  activeRole = role;
  const client = getSupabase(role);
  await loadEverything(client);
  setChangeHandler(handleLocalChange);
  listenForChanges(client);
  document.addEventListener("visibilitychange", handleVisibility);
  if (role === "admin") {
    refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") void catchUp(true);
    }, ADMIN_REFRESH_MS);
  }
}

export async function stopSync() {
  clearInterval(refreshTimer);
  refreshTimer = undefined;
  document.removeEventListener("visibilitychange", handleVisibility);
  setChangeHandler(null);
  if (channel && activeRole) await getSupabase(activeRole).removeChannel(channel);
  channel = null;
  activeRole = null;
  clearState();
}
