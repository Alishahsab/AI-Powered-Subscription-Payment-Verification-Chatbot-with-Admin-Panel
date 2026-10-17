"use client";

import { useSyncExternalStore } from "react";
import { createEmptyState } from "../defaults";
import type { AppState } from "../types";

type ChangeHandler = (before: AppState, after: AppState) => void;

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
  const draft = structuredClone(state);
  change(draft);
  state = draft;
  notifyListeners();
  changeHandler?.(before, draft);
}

export function applyRemoteChange(change: (draft: AppState) => void) {
  const draft = structuredClone(state);
  change(draft);
  state = draft;
  notifyListeners();
}

export function clearState() {
  state = createEmptyState();
  notifyListeners();
}
