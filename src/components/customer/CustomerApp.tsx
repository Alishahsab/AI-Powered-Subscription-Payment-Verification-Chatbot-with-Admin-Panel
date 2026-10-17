"use client";

import { useState } from "react";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useOrderExpiry } from "@/hooks/useOrderExpiry";
import { usePresence } from "@/hooks/usePresence";
import { textColorFor } from "@/lib/format";
import { useAppState } from "@/lib/store/state";
import AuthScreen from "./AuthScreen";
import Sidebar from "./Sidebar";
import ChatScreen from "./chat/ChatScreen";

const SESSION_KEY = "premium_store_customer";

function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(customerId: string | null) {
  try {
    if (customerId) localStorage.setItem(SESSION_KEY, customerId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export default function CustomerApp() {
  const state = useAppState();
  const isDesktop = useIsDesktop();
  const [customerId, setCustomerId] = useState<string | null>(readSession);
  const customer = state.customers.find((item) => item.id === customerId);

  useOrderExpiry();
  usePresence(customer?.id);

  const signIn = (id: string) => {
    writeSession(id);
    setCustomerId(id);
  };

  const signOut = () => {
    writeSession(null);
    setCustomerId(null);
  };

  const accent = state.settings.accent;
  const themeStyle = { ["--accent" as string]: accent, ["--accent-ink" as string]: textColorFor(accent) };

  return (
    <div className="customer-app min-h-dvh w-full bg-[var(--page)] flex" style={themeStyle}>
      {customer ? (
        <div className="flex-1 flex h-dvh md:p-4 lg:p-5">
          <div className="relative flex-1 flex max-w-[1440px] mx-auto bg-[var(--bg)] md:rounded-3xl md:border md:border-[var(--line)] md:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] overflow-hidden">
            {isDesktop && <Sidebar customer={customer} onSignOut={signOut} />}
            <ChatScreen customer={customer} onSignOut={isDesktop ? undefined : signOut} />
          </div>
        </div>
      ) : (
        <AuthScreen onSignedIn={signIn} />
      )}
    </div>
  );
}
