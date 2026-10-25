"use client";

import { useCallback, useEffect, useRef, useState, type UIEvent } from "react";

const HIDE_AFTER_MS = 1500;

// Like WhatsApp: while the chat scrolls, a small label at the top shows the day of the messages
// on screen, and it fades out shortly after scrolling stops. Day dividers carry `data-day`.
export function useFloatingDay() {
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const top = element.getBoundingClientRect().top;
    let current = "";
    for (const divider of element.querySelectorAll<HTMLElement>("[data-day]")) {
      if (divider.getBoundingClientRect().top - top > 8) break;
      current = divider.dataset.day ?? "";
    }
    setLabel(current);
    setVisible(Boolean(current));
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
  }, []);

  return { label, visible, onScroll };
}
