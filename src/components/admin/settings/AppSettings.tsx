"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Moon, Search, X } from "lucide-react";
import type { AdminTheme } from "@/hooks/useAdminTheme";
import { useBackButton } from "@/hooks/useBackButton";
import { classNames } from "@/lib/format";
import { loadAdminProfile, saveAdminName, type AdminProfile } from "@/lib/supabase/adminProfile";
import Modal from "../ui/Modal";
import { inputClass } from "../ui/styles";
import AdminPhoto from "./AdminPhoto";
import { SettingsErrors, SettingsTabContent, settingsTabs, type SettingsTabKey } from "./settingsTabs";
import { useSettingsDraft } from "./useSettingsDraft";

type AppSettingsProps = {
  theme: AdminTheme;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

const roundButton = "size-11 shrink-0 rounded-full bg-white text-[#0C2660] shadow-[0_6px_18px_-10px_rgba(12,38,96,0.4)] grid place-items-center";
const card = "w-full flex items-center gap-3 rounded-[20px] bg-[#f3f5fa] px-3.5 py-[11px] text-left";
const cardIcon = "size-9 shrink-0 rounded-xl grid place-items-center";

export default function AppSettings({ theme, onToggleTheme, onSignOut }: AppSettingsProps) {
  const settings = useSettingsDraft();
  const [openTab, setOpenTab] = useState<SettingsTabKey | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [editingName, setEditingName] = useState(false);
  useBackButton(Boolean(openTab), () => setOpenTab(null));

  useEffect(() => {
    loadAdminProfile().then(setProfile);
  }, []);

  if (openTab) return <SettingsScreen tab={openTab} settings={settings} onBack={() => setOpenTab(null)} />;

  const words = query.trim().toLowerCase();
  const tabs = settingsTabs.filter((tab) => `${tab.label} ${tab.description}`.toLowerCase().includes(words));

  return (
    <div className="relative h-[calc(100%+92px)] overflow-y-auto">
      <div className="profile-glow pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="profile-doodle pointer-events-none absolute inset-x-0 top-0 h-[240px]" />

      <div className="relative px-4 pt-3">
        <div className="flex justify-end">
          <button onClick={() => (searching ? (setSearching(false), setQuery("")) : setSearching(true))} className={roundButton} aria-label={searching ? "Close search" : "Search settings"}>
            {searching ? <X size={20} strokeWidth={2.4} /> : <Search size={20} strokeWidth={2.4} />}
          </button>
        </div>
        {searching && (
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings"
            className="mt-2 w-full h-11 rounded-full bg-white px-4 text-[14px] outline-none shadow-[0_8px_24px_-16px_rgba(12,38,96,0.35)] placeholder:text-zinc-400"
          />
        )}
      </div>

      <div className="relative mt-5">
        <AdminPhoto profile={profile} onChange={(avatarPath) => setProfile((current) => current && { ...current, avatarPath })} />

        <div className="-mt-16 min-h-[calc(100%-4rem)] rounded-t-[34px] bg-white px-4 pt-[84px] pb-[116px]">
          <button onClick={() => profile && setEditingName(true)} className="block mx-auto text-center">
            <span className="block text-[26px] font-extrabold tracking-tight text-[#0C2660]">{profile?.name ?? " "}</span>
            <span className="block mt-0.5 text-[13.5px] text-zinc-500">{profile?.email}</span>
          </button>

          <div className="mt-6 space-y-2">
            {tabs.map(({ key, label, description, Icon }) => (
              <button key={key} onClick={() => setOpenTab(key)} className={card}>
                <span className={`${cardIcon} bg-white text-[#0C2660]`}>
                  <Icon size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-bold text-zinc-900">{label}</span>
                  <span className="block truncate text-[11.5px] text-zinc-500">{description}</span>
                </span>
                <ChevronRight size={17} className="text-zinc-400" />
              </button>
            ))}

            {!words && (
              <>
                <button onClick={onToggleTheme} className={card} role="switch" aria-checked={theme === "dark"}>
                  <span className={`${cardIcon} bg-white text-[#0C2660]`}>
                    <Moon size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-bold text-zinc-900">Dark mode</span>
                    <span className="block truncate text-[11.5px] text-zinc-500">Switch between light and dark</span>
                  </span>
                  <span className={classNames("relative h-6 w-[42px] shrink-0 rounded-full transition", theme === "dark" ? "bg-[#D4A551]" : "bg-zinc-300")}>
                    <span className={classNames("absolute top-[3px] size-[18px] rounded-full bg-white transition-all", theme === "dark" ? "left-[21px]" : "left-[3px]")} />
                  </span>
                </button>
                <button onClick={onSignOut} className={card}>
                  <span className={`${cardIcon} bg-red-50 text-red-600`}>
                    <LogOut size={18} />
                  </span>
                  <span className="flex-1 text-[14px] font-bold text-red-600">Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {editingName && profile && (
        <NameDialog
          profile={profile}
          onSaved={(name) => setProfile({ ...profile, name })}
          onClose={() => setEditingName(false)}
        />
      )}
    </div>
  );
}

type SettingsScreenProps = {
  tab: SettingsTabKey;
  settings: ReturnType<typeof useSettingsDraft>;
  onBack: () => void;
};

function SettingsScreen({ tab, settings, onBack }: SettingsScreenProps) {
  const { draft, updateDraft, hasChanges, justSaved, errors, save, discard } = settings;
  const title = settingsTabs.find((item) => item.key === tab)?.label;

  return (
    <div className="relative h-full flex flex-col">
      <div className="profile-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />

      <header className="relative shrink-0 flex items-center gap-2 px-4 pt-3 pb-2">
        <button onClick={onBack} className={roundButton} aria-label="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-extrabold text-[#0C2660] pr-11">{title}</h1>
      </header>

      <div className="relative flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-4">
        <SettingsErrors errors={errors} />
        <SettingsTabContent tab={tab} draft={draft} updateDraft={updateDraft} />
      </div>

      {(hasChanges || justSaved) && (
        <div className="relative shrink-0 px-4 pt-2 pb-3">
          {hasChanges ? (
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <button onClick={discard} className="h-12 rounded-2xl bg-white text-[14px] font-bold text-zinc-700 shadow-[0_8px_24px_-16px_rgba(12,38,96,0.35)]">
                Discard
              </button>
              <button onClick={save} className="h-12 rounded-2xl bg-[#0C2660] text-[14px] font-extrabold text-white shadow-[0_12px_24px_-12px_#0C2660]">
                Save changes
              </button>
            </div>
          ) : (
            <div className="h-12 rounded-2xl bg-emerald-50 text-emerald-700 text-[13.5px] font-bold grid place-items-center fade-in">Saved and live</div>
          )}
        </div>
      )}
    </div>
  );
}

function NameDialog({ profile, onSaved, onClose }: { profile: AdminProfile; onSaved: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(profile.name === "Admin" ? "" : profile.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clean = name.trim();

  const save = async () => {
    if (!clean) return;
    setBusy(true);
    try {
      await saveAdminName(profile.userId, clean);
      onSaved(clean);
      onClose();
    } catch {
      setError("The name could not be saved. Check your internet and try again.");
      setBusy(false);
    }
  };

  return (
    <Modal title="Your name" description="Shown on your profile" onClose={onClose}>
      <input autoFocus value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Your name" className={`${inputClass} h-11`} />
      {error && <p className="mt-3 text-[12.5px] text-red-600">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="h-11 rounded-xl border border-zinc-200 text-[14px] font-semibold text-zinc-700">
          Cancel
        </button>
        <button onClick={save} disabled={!clean || busy} className="h-11 rounded-xl bg-[#0C2660] text-[14px] font-semibold text-white disabled:opacity-40">
          Save
        </button>
      </div>
    </Modal>
  );
}
