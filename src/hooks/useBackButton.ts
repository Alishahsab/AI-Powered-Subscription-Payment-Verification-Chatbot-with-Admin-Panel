"use client";

import { useEffect, useRef } from "react";

// Open screens (a chat, a pop-up, a menu) are layered over each other. Each one adds a step to the
// browser history, so the phone's Back button or back gesture closes the top one instead of leaving
// the app. Closing a layer from the screen removes its step again.
const layers: number[] = [];
const closers = new Map<number, () => void>();
let nextId = 1;
let ignoredBacks = 0;
let listening = false;

function handleBack() {
  if (ignoredBacks > 0) {
    ignoredBacks -= 1;
    return;
  }
  const top = layers.pop();
  if (top !== undefined) closers.get(top)?.();
}

export function useBackButton(open: boolean, onBack: () => void) {
  const latestOnBack = useRef(onBack);

  useEffect(() => {
    latestOnBack.current = onBack;
  });

  useEffect(() => {
    if (!open) return;
    if (!listening) {
      window.addEventListener("popstate", handleBack);
      listening = true;
    }
    const id = nextId++;
    layers.push(id);
    closers.set(id, () => latestOnBack.current());
    window.history.pushState({ layer: id }, "");

    return () => {
      closers.delete(id);
      const index = layers.indexOf(id);
      if (index < 0) return;
      layers.splice(index, 1);
      ignoredBacks += 1;
      window.history.back();
    };
  }, [open]);
}
