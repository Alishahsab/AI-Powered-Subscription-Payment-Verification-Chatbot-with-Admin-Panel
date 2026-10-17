"use client";

import { useSyncExternalStore } from "react";
import { createDemoState, STATE_VERSION } from "../demo/seed";
import type { AppState } from "../types";

const STORAGE_KEY = "premium_store_state";
const listeners = new Set<() => void>();
let state: AppState | null = null;

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {}

  const fresh = createDemoState();
  saveState(fresh);
  return fresh;
}

function saveState(next: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Could not save state", error);
  }
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getState() {
  if (!state) state = loadState();
  return state;
}

export function updateState(change: (draft: AppState) => void) {
  const draft = structuredClone(getState());
  change(draft);
  state = draft;
  saveState(draft);
  notifyListeners();
}

export function resetState() {
  state = createDemoState();
  saveState(state);
  notifyListeners();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      state = JSON.parse(event.newValue);
      notifyListeners();
    } catch {}
  });
}
