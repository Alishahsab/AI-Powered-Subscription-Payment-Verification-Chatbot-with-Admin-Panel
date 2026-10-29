"use client";

import { useRef, useState } from "react";

const MIN_DISTANCE = 60;

export function useCategorySwipe<Key extends string>(keys: Key[], current: Key, onChange: (key: Key) => void) {
  const [slide, setSlide] = useState<"from-right" | "from-left">("from-right");
  const start = useRef<{ x: number; y: number } | null>(null);

  const select = (key: Key) => {
    if (key === current) return;
    setSlide(keys.indexOf(key) > keys.indexOf(current) ? "from-right" : "from-left");
    onChange(key);
  };

  const step = (by: number) => {
    const next = keys[keys.indexOf(current) + by];
    if (next) select(next);
  };

  const swipe = {
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
      step(dx < 0 ? 1 : -1);
    },
  };

  return { select, slide, swipe };
}
