"use client";

import { useEffect, useSyncExternalStore } from "react";

const counts = { screens: 0, covers: 0 };
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

function useCount(kind: keyof typeof counts, active: boolean) {
  useEffect(() => {
    if (!active) return;
    counts[kind] += 1;
    notify();
    return () => {
      counts[kind] -= 1;
      notify();
    };
  }, [kind, active]);
}

export function useHideTabBar(hide: boolean) {
  useCount("screens", hide);
}

export function useCoverTabBar(cover: boolean) {
  useCount("covers", cover);
}

export function useTabBarHidden() {
  return useSyncExternalStore(subscribe, () => counts.screens > 0, () => false);
}

export function useTabBarCovered() {
  return useSyncExternalStore(subscribe, () => counts.covers > 0, () => false);
}
