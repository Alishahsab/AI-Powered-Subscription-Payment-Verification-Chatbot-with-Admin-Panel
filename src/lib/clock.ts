const OFFSET_KEY = "premium-store-clock-offset";
const RECHECK_MS = 10 * 60_000;

let offset = readSavedOffset();
let checkedAt = 0;

function readSavedOffset() {
  try {
    return Number(localStorage.getItem(OFFSET_KEY)) || 0;
  } catch {
    return 0;
  }
}

// The current time by the server's clock. A phone set a few minutes (or hours) wrong still gets
// the right order timers, "just now" labels and Today/Yesterday dates.
export function serverNow() {
  return Date.now() + offset;
}

// Measures how far this device's clock is from the server's. Kept for offline starts.
export async function syncClock() {
  if (Date.now() - checkedAt < RECHECK_MS) return;
  try {
    const sentAt = Date.now();
    const response = await fetch("/api/time", { cache: "no-store" });
    const { now } = (await response.json()) as { now: number };
    const receivedAt = Date.now();
    if (!response.ok || typeof now !== "number") return;
    offset = Math.round(now - (sentAt + receivedAt) / 2);
    checkedAt = receivedAt;
    try {
      localStorage.setItem(OFFSET_KEY, String(offset));
    } catch {}
  } catch {
    // Offline: the last known difference stays in use.
  }
}
