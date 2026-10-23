"use client";

import { useEffect, useState } from "react";

export type AdminTheme = "light" | "dark";

const STORAGE_KEY = "premium-store-admin-theme";

function savedTheme(): AdminTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

// The admin panel's light or dark look, remembered in this browser. Only the admin panel sets it,
// so the customer app and the admin sign-in screen always stay light.
export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>(savedTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.adminTheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The choice simply is not remembered.
    }
    return () => {
      delete root.dataset.adminTheme;
    };
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")) };
}
