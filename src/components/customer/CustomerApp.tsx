"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { inkFor, useExpirySweep, useIsDesktop } from "@/components/shared";
import Onboarding from "./Onboarding";
import Home from "./Home";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import OrderHistory from "./OrderHistory";

export type Screen = "home" | "chat" | "history";
const SESSION = "ps_customer";

export default function CustomerApp() {
  const s = useStore();
  const isDesktop = useIsDesktop();
  const [customerId, setCustomerId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION);
    } catch {
      return null;
    }
  });
  const [screen, setScreen] = useState<Screen>("home");
  useExpirySweep();

  // a missing customer (e.g. after a demo reset) simply falls back to onboarding
  const customer = s.customers.find((c) => c.id === customerId);

  const login = (id: string) => {
    try {
      sessionStorage.setItem(SESSION, id);
    } catch {}
    setCustomerId(id);
    setScreen("home");
  };
  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION);
    } catch {}
    setCustomerId(null);
  };

  const accent = s.settings.accent;
  // desktop has the sidebar instead of a home screen, so it opens straight into chat
  const view: Screen = isDesktop && screen === "home" ? "chat" : screen;
  const back = () => setScreen("home");

  return (
    <div
      className="cust min-h-dvh w-full bg-[var(--page)] flex"
      style={{ ["--accent" as string]: accent, ["--accent-ink" as string]: inkFor(accent) }}
    >
      {!customer ? (
        <Onboarding onDone={login} />
      ) : (
        <div className="flex-1 flex h-dvh md:p-4 lg:p-5">
          <div className="relative flex-1 flex max-w-[1440px] mx-auto bg-[var(--bg)] md:rounded-3xl md:border md:border-[var(--line)] md:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] overflow-hidden">
            {isDesktop && (
              <aside className="w-[320px] lg:w-[350px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] flex flex-col">
                <Sidebar customer={customer} view={view} onOpen={setScreen} onLogout={logout} />
              </aside>
            )}
            <section className="relative flex-1 min-w-0 flex flex-col">
              {view === "chat" ? (
                <ChatView customer={customer} onBack={back} showBack={!isDesktop} />
              ) : view === "history" ? (
                <OrderHistory customer={customer} onBack={back} showBack={!isDesktop} />
              ) : (
                <Home customer={customer} onOpen={setScreen} onLogout={logout} />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
