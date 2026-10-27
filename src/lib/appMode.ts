const IN_APP_KEY = "premium-store-in-app";

type AppChannel = { postMessage: (message: string) => void };

// The Android/iOS admin app opens the panel with ?app=1. It shows its own header and tabs,
// so the panel hides its side menu and follows the app's tabs instead.
export function isInApp() {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("app") === "1") sessionStorage.setItem(IN_APP_KEY, "1");
    return sessionStorage.getItem(IN_APP_KEY) === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("app") === "1";
  }
}

export function tellApp(message: string) {
  (window as unknown as { PremiumStoreApp?: AppChannel }).PremiumStoreApp?.postMessage(message);
}
