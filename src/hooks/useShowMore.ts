"use client";

import { useEffect, useRef, useState } from "react";

const PAGE = 30;

export function useShowMore<Item>(items: Item[], resetKey: string) {
  const [count, setCount] = useState(PAGE);
  const [lastKey, setLastKey] = useState(resetKey);
  const sentinel = useRef<HTMLDivElement>(null);

  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setCount(PAGE);
  }

  const hasMore = count < items.length;

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setCount((shown) => shown + PAGE);
    }, { rootMargin: "400px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, count]);

  return { visible: items.slice(0, count), sentinel, hasMore };
}
