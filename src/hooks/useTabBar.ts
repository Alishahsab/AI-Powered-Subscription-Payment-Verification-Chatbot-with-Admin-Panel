"use client";

import { useEffect, useSyncExternalStore } from "react";

let hiders = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHideTabBar(hide: boolean) {
  useEffect(() => {
    if (!hide) return;
    hiders += 1;
    notify();
    return () => {
      hiders -= 1;
      notify();
    };
  }, [hide]);
}

export function useTabBarHidden() {
  return useSyncExternalStore(subscribe, () => hiders > 0, () => false);
}
