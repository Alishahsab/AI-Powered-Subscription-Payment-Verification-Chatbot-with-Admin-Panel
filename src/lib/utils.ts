import type { AdminStatus, Settings } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const rs = (n: number) => "Rs " + n.toLocaleString("en-PK");

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function fmtTime(t: number) {
  return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function fmtDate(t: number) {
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(t: number) {
  return `${fmtDate(t)}, ${fmtTime(t)}`;
}

export function timeAgo(t: number, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(t);
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function minutesOf(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function withinHours(s: Settings, now = Date.now()) {
  const d = new Date(now);
  const cur = d.getHours() * 60 + d.getMinutes();
  const a = minutesOf(s.hours.start);
  const b = minutesOf(s.hours.end);
  return a <= b ? cur >= a && cur < b : cur >= a || cur < b;
}

export function effectiveStatus(s: Settings, now = Date.now()): AdminStatus {
  if (s.status === "offline") return "offline";
  if (s.hours.enforce && !withinHours(s, now)) return "offline";
  return s.status;
}

export function hoursLabel(s: Settings) {
  const f = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m || 0);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: m ? "2-digit" : undefined });
  };
  return `${f(s.hours.start)} to ${f(s.hours.end)}`;
}

export const statusMeta: Record<AdminStatus, { label: string; dot: string; hint: string }> = {
  active: { label: "Online", dot: "bg-emerald-500", hint: "Typically replies in a few minutes" },
  away: { label: "Away", dot: "bg-amber-400", hint: "Back shortly" },
  offline: { label: "Offline", dot: "bg-zinc-400", hint: "Outside working hours" },
};

export async function compressImage(file: File, max = 1000, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function copyText(t: string) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    return false;
  }
}

export function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq: number, at: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.3);
    };
    play(880, 0);
    play(1320, 0.14);
  } catch {}
}
