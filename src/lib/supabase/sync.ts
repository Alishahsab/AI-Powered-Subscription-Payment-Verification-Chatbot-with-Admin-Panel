import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { applyRemoteChange, clearState, getState, setChangeHandler } from "../store/state";
import type { AppState, StoreConfig } from "../types";
import { getSupabase, type AppRole } from "./client";
import { configFromRow, configToRow } from "./mappers";
import { tables, type TableSync } from "./tables";

type Row = Record<string, unknown>;

let activeRole: AppRole | null = null;
let channel: RealtimeChannel | null = null;

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

// ---------- Outbox ----------
// Every change is kept on the device until the server has it. Changes are sent one by one, in order.
// If the connection drops or the app closes, they are sent again when it comes back, so nothing is lost.
// If the server refuses a change (for example the store has just closed), the screen reloads from the server
// so it always matches what is really saved.

type Op =
  | { kind: "insert"; table: string; key: string; rows: Row[]; tries: number }
  | { kind: "update"; table: string; key: string; row: Row; tries: number }
  | { kind: "delete"; table: string; key: string; ids: string[]; tries: number }
  | { kind: "config"; row: Row; tries: number };

let outbox: Op[] = [];
let outboxKey = "";
let flushing: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let refreshWanted = false;
const problemListeners = new Set<(message: string) => void>();

// Lets the apps tell the person when the server refused something they did.
export function onSyncProblem(listener: (message: string) => void) {
  problemListeners.add(listener);
  return () => {
    problemListeners.delete(listener);
  };
}

function saveOutbox() {
  try {
    if (outbox.length) localStorage.setItem(outboxKey, JSON.stringify(outbox));
    else localStorage.removeItem(outboxKey);
  } catch {
    // Without storage the outbox still works while the app is open.
  }
}

function loadOutbox(key: string) {
  outboxKey = key;
  try {
    outbox = JSON.parse(localStorage.getItem(key) ?? "[]") as Op[];
  } catch {
    outbox = [];
  }
}

type WriteResult = { error: { message: string; code?: string } | null; status: number };

// No answer, a server hiccup or an expired sign-in can pass; a refusal by the database rules cannot.
function canRetry({ error, status }: WriteResult) {
  if (!error) return false;
  if (!error.code || status === 0 || status === 401 || status === 408 || status === 429 || status >= 500) return true;
  return error.code === "PGRST301" || error.code === "PGRST303";
}

async function runOp(client: SupabaseClient, op: Op): Promise<WriteResult> {
  if (op.kind === "insert") {
    let rows = op.rows;
    // After a failed attempt the rows may have arrived anyway, so only the missing ones are sent again.
    if (op.tries > 0) {
      const ids = rows.map((row) => row[op.key]);
      const { data, error, status } = await client.from(op.table).select(op.key).in(op.key, ids);
      if (error) return { error, status };
      const saved = new Set((data ?? []).map((row) => String((row as unknown as Row)[op.key])));
      rows = rows.filter((row) => !saved.has(String(row[op.key])));
      if (rows.length === 0) return { error: null, status: 200 };
    }
    return await client.from(op.table).insert(rows);
  }
  if (op.kind === "update") return await client.from(op.table).update(op.row).eq(op.key, op.row[op.key]);
  if (op.kind === "delete") return await client.from(op.table).delete().in(op.key, op.ids);
  return await client.from("store_config").upsert(op.row);
}

function forgetLocalWrites(op: Op) {
  if (op.kind === "insert") op.rows.forEach((row) => recentLocalWrites.delete(`${op.table}:${row[op.key]}`));
  if (op.kind === "update") recentLocalWrites.delete(`${op.table}:${op.row[op.key]}`);
}

function scheduleRetry(tries: number) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void flushOutbox(), Math.min(30_000, 1000 * 2 ** Math.min(tries, 5)));
}

function flushOutbox(): Promise<void> {
  if (!flushing) {
    flushing = sendOutbox().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function sendOutbox() {
  let refused = false;
  while (activeRole && outbox.length) {
    const op = outbox[0];
    const result: WriteResult = await runOp(getActiveClient(), op).catch((error: unknown) => ({ error: { message: String(error) }, status: 0 }));

    if (result.error && canRetry(result)) {
      op.tries += 1;
      saveOutbox();
      scheduleRetry(op.tries);
      return;
    }

    outbox.shift();
    saveOutbox();
    if (result.error) {
      const message = result.error.message;
      console.warn(`The server refused a change to ${op.kind === "config" ? "settings" : op.table}`, message);
      forgetLocalWrites(op);
      refused = true;
      problemListeners.forEach((listener) => listener(message));
    } else if (op.kind === "update") {
      refreshLocalWrite(op.table, String(op.row[op.key]));
    }
  }

  if (activeRole && (refused || refreshWanted)) {
    refreshWanted = false;
    void catchUp();
  }
}

function queueChanges(changes: TableChanges[], config: StoreConfig | null) {
  for (const { table, inserted, updated, deletedIds } of changes) {
    if (inserted.length) outbox.push({ kind: "insert", table: table.name, key: table.key, rows: inserted, tries: 0 });
    for (const row of updated) outbox.push({ kind: "update", table: table.name, key: table.key, row, tries: 0 });
    if (deletedIds.length && activeRole === "admin") outbox.push({ kind: "delete", table: table.name, key: table.key, ids: deletedIds, tries: 0 });
  }
  if (config) outbox.push({ kind: "config", row: configToRow(config), tries: 0 });
  saveOutbox();
  void flushOutbox();
}

function handleLocalChange(before: AppState, after: AppState) {
  const changes = tables.map((table) => findTableChanges(table, before, after));
  localVersion += 1;

  for (const change of changes) {
    for (const row of change.inserted) rememberLocalWrite(change.table.name, row, change.table.key, true);
    for (const row of change.updated) rememberLocalWrite(change.table.name, row, change.table.key, false);
  }

  const configChanged = activeRole === "admin" && JSON.stringify(pickConfig(before)) !== JSON.stringify(pickConfig(after));
  queueChanges(changes, configChanged ? pickConfig(after) : null);
}

function handleOnline() {
  void flushOutbox();
  void catchUp();
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
// The admin panel therefore refreshes every 20 seconds; messages only for the last 30 minutes to keep it light.
const ADMIN_REFRESH_MS = 20_000;
const ADMIN_REFRESH_MESSAGES_MS = 30 * 60_000;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

// Events sent while the connection was down are not replayed, so reload everything once.
// A reload that overlapped a local change is older than the screen, so it is retried.
async function catchUp(recentMessagesOnly = false) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!activeRole) return;
    // Changes still waiting to be sent are newer than the server; reload once they are through.
    if (outbox.length) {
      refreshWanted = true;
      void flushOutbox();
      return;
    }
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
  // Changes left from an earlier visit (connection lost or app closed) are sent before loading.
  const { data: auth } = await client.auth.getSession();
  loadOutbox(`premium-store-outbox:${role}:${auth.session?.user.id ?? "guest"}`);
  if (outbox.length) await flushOutbox();
  await loadEverything(client);
  setChangeHandler(handleLocalChange);
  listenForChanges(client);
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("online", handleOnline);
  if (role === "admin") {
    refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") void catchUp(true);
    }, ADMIN_REFRESH_MS);
  }
}

export async function stopSync() {
  clearInterval(refreshTimer);
  refreshTimer = undefined;
  clearTimeout(retryTimer);
  // Unsent changes stay saved on the device for this account and go out at the next sign-in.
  outbox = [];
  window.removeEventListener("online", handleOnline);
  document.removeEventListener("visibilitychange", handleVisibility);
  setChangeHandler(null);
  if (channel && activeRole) await getSupabase(activeRole).removeChannel(channel);
  channel = null;
  activeRole = null;
  clearState();
}
