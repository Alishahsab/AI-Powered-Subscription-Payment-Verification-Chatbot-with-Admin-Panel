"use client";

import { useSyncExternalStore } from "react";
import { produce, setAutoFreeze } from "immer";
import { createEmptyState } from "../defaults";
import type { AppState } from "../types";

type ChangeHandler = (before: AppState, after: AppState) => void;

// Changes copy only what they touch; everything else keeps its identity. Copying the whole state
// (thousands of messages) on every tap made the app stutter, and identity lets the sync and the
// screens skip everything that did not change.
setAutoFreeze(false);

const listeners = new Set<() => void>();
let state: AppState = createEmptyState();
let changeHandler: ChangeHandler | null = null;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function setChangeHandler(handler: ChangeHandler | null) {
  changeHandler = handler;
}

export function updateState(change: (draft: AppState) => void) {
  const before = state;
  const after = produce(state, change);
  if (after === before) return;
  state = after;
  notifyListeners();
  changeHandler?.(before, after);
}

export function applyRemoteChange(change: (draft: AppState) => void) {
  const after = produce(state, change);
  if (after === state) return;
  state = after;
  notifyListeners();
}

export function clearState() {
  state = createEmptyState();
  notifyListeners();
}
