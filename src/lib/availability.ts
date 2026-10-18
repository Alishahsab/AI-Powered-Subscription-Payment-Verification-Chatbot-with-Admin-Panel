import type { AdminStatus, Settings } from "./types";

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

export function isWithinWorkingHours(settings: Settings, now = Date.now()) {
  const date = new Date(now);
  const current = date.getHours() * 60 + date.getMinutes();
  const start = toMinutes(settings.hours.start);
  const end = toMinutes(settings.hours.end);

  if (start <= end) return current >= start && current < end;
  return current >= start || current < end;
}

export function getEffectiveStatus(settings: Settings, now = Date.now()): AdminStatus {
  if (settings.status === "offline") return "offline";
  if (settings.hours.enforce && !isWithinWorkingHours(settings, now)) return "offline";
  return settings.status;
}

export function minutesUntilOpen(settings: Settings, now = Date.now()) {
  const date = new Date(now);
  const current = date.getHours() * 60 + date.getMinutes();
  const start = toMinutes(settings.hours.start);
  return (start - current + 24 * 60) % (24 * 60);
}

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${Math.max(1, minutes)} min`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: minutes ? "2-digit" : undefined });
}

export function workingHoursLabel(settings: Settings) {
  return `${formatHour(settings.hours.start)} to ${formatHour(settings.hours.end)}`;
}

export const statusDetails: Record<AdminStatus, { label: string; dot: string; hint: string }> = {
  active: { label: "Online", dot: "bg-emerald-500", hint: "Typically replies in a few minutes" },
  away: { label: "Away", dot: "bg-amber-400", hint: "Back shortly" },
  offline: { label: "Offline", dot: "bg-zinc-400", hint: "Outside working hours" },
};
