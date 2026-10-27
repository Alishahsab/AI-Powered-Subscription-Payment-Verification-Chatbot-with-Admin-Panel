"use client";

import { useEffect, useState } from "react";
import { useAdminTheme } from "@/hooks/useAdminTheme";
import { useBackButton } from "@/hooks/useBackButton";
import { useOrderExpiry } from "@/hooks/useOrderExpiry";
import { isInApp, tellApp } from "@/lib/appMode";
import SyncNotice from "../SyncNotice";
import AdminSidebar from "./layout/AdminSidebar";
import PaymentIssueTimer from "./layout/PaymentIssueTimer";
import Toasts from "./layout/Toasts";
import ConnectionBar from "./layout/ConnectionBar";
import TopBar from "./layout/TopBar";
import type { NavTarget, Section } from "./navigation";
import Customers from "./customers/Customers";
import Dashboard from "./dashboard/Dashboard";
import Inbox from "./inbox/Inbox";
import SearchResults from "./search/SearchResults";
import Settings from "./settings/Settings";

const appTabs: Section[] = ["inbox", "bot", "dashboard", "settings"];

function sectionFromHash(): Section {
  const section = window.location.hash.slice(1) as Section;
  return appTabs.includes(section) ? section : "dashboard";
}

export default function AdminShell({ onSignOut }: { onSignOut: () => void }) {
  const [inApp] = useState(isInApp);
  const [target, setTarget] = useState<NavTarget>(() => ({ section: inApp ? sectionFromHash() : "dashboard" }));
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  useOrderExpiry();
  const { theme, toggleTheme } = useAdminTheme();

  const navigate = (next: NavTarget) => {
    setTarget(next);
    setMenuOpen(false);
    if (next.section !== "search") setSearchQuery("");
  };

  const search = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) setTarget({ section: "search" });
  };

  // Back from any other part returns to the dashboard; Back on the dashboard leaves the panel.
  useBackButton(target.section !== "dashboard", () => navigate({ section: "dashboard" }));
  useBackButton(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    if (!inApp) return;
    const app = window as unknown as { premiumStoreShowSection?: (section: Section) => void };
    app.premiumStoreShowSection = (section) => setTarget({ section: appTabs.includes(section) ? section : "dashboard" });
    return () => {
      delete app.premiumStoreShowSection;
    };
  }, [inApp]);

  useEffect(() => {
    if (inApp) tellApp(target.section);
  }, [inApp, target.section]);

  const sidebar = <AdminSidebar current={target.section} onNavigate={navigate} onSignOut={onSignOut} />;

  return (
    <div className="admin-app fixed inset-0 flex overflow-hidden">
      {!inApp && <aside className="hidden lg:block w-[244px] shrink-0">{sidebar}</aside>}

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[260px] slide-in-left">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          searchQuery={searchQuery}
          onSearch={search}
          onClearSearch={() => navigate({ section: "dashboard" })}
          onOpenMenu={inApp ? undefined : () => setMenuOpen(true)}
          onNavigate={navigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <ConnectionBar />

        <main className="flex-1 min-h-0 overflow-hidden">
          {target.section === "dashboard" && <Dashboard onNavigate={navigate} />}
          {target.section === "customers" && <Customers onNavigate={navigate} />}
          {target.section === "inbox" && <Inbox key={`inbox-${target.customerId}-${target.tab}`} view="inbox" initialTab={target.tab} initialCustomerId={target.customerId} />}
          {target.section === "bot" && <Inbox key={`bot-${target.customerId}-${target.botFilter}`} view="bot" initialCustomerId={target.customerId} initialBotFilter={target.botFilter} />}
          {target.section === "settings" && <Settings />}
          {target.section === "search" && <SearchResults query={searchQuery} onNavigate={navigate} />}
        </main>
      </div>

      <Toasts onNavigate={navigate} />
      <SyncNotice />
      <PaymentIssueTimer />
    </div>
  );
}
