export function createId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function formatMoney(amount: number) {
  return "Rs " + amount.toLocaleString("en-PK");
}

export function formatTime(time: number) {
  return new Date(time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDate(time: number) {
  return new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(time: number) {
  return `${formatDate(time)}, ${formatTime(time)}`;
}

export function timeAgo(time: number, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < 45) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(time);
}

export function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function classNames(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

export function textColorFor(hex: string) {
  const value = parseInt(hex.replace("#", ""), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const brightness = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return brightness > 0.55 ? "#15130d" : "#ffffff";
}
