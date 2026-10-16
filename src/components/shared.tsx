"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const DESKTOP = "(min-width: 768px)";

/** True on tablet/desktop widths; drives the two-pane customer layout. */
export function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false
  );
}
import { sweepExpired } from "@/lib/store";

/** Re-renders every `ms` so countdowns and relative times stay fresh. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Expires unpaid orders once their payment window closes. */
export function useExpirySweep() {
  useEffect(() => {
    sweepExpired();
    const t = setInterval(sweepExpired, 2000);
    return () => clearInterval(t);
  }, []);
}

export function inkFor(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#15130d" : "#ffffff";
}

/** Brand mark (public/logo-icon.png, cropped from the Premium Store logo). */
export function Monogram({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-icon.png" alt="Premium Store" width={size} height={size} className={`shrink-0 select-none ${className}`} style={{ width: size, height: size }} draggable={false} />
  );
}
