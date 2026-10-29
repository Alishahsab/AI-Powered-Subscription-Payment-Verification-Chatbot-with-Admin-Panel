"use client";

import { useRef, useState } from "react";

const MIN_DISTANCE = 60;

export function useSwipe(onNext?: () => void, onPrevious?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: React.TouchEvent) => {
      start.current = null;
      if ((event.target as HTMLElement).closest('[role="dialog"]')) return;
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onNext?.();
      else onPrevious?.();
    },
  };
}

type Edges = { before?: () => void; after?: () => void };

export function useCategorySwipe<Key extends string>(keys: Key[], current: Key, onChange: (key: Key) => void, edges: Edges = {}) {
  const [slide, setSlide] = useState<"from-right" | "from-left">("from-right");

  const select = (key: Key) => {
    if (key === current) return;
    setSlide(keys.indexOf(key) > keys.indexOf(current) ? "from-right" : "from-left");
    onChange(key);
  };

  const step = (by: number) => {
    const next = keys[keys.indexOf(current) + by];
    if (next) select(next);
    else if (by < 0) edges.before?.();
    else edges.after?.();
  };

  const swipe = useSwipe(() => step(1), () => step(-1));

  return { select, slide, swipe };
}
