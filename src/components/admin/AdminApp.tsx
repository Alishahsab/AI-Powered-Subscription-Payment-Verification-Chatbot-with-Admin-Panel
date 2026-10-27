"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isInApp } from "@/lib/appMode";
import { adminSignIn, adminSignOut, checkAdminAccess, rememberedAdmin } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import { startSync, stopSync } from "@/lib/supabase/sync";
import ConfirmDialog from "../ConfirmDialog";
import AdminShell from "./AdminShell";
import LoginScreen from "./LoginScreen";

type AccessCheck = { userId: string; allowed: boolean };

export default function AdminApp() {
  const state = useAppState();
  const { user, checking } = useAuthUser("admin");
  const [access, setAccess] = useState<AccessCheck | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  // An admin confirmed before on this device opens the panel at once; the check still runs and can sign them out.
  const remembered = Boolean(user && rememberedAdmin(user.id));
  const checked = Boolean(user && access?.userId === user.id);
  const allowed = Boolean(user && (checked ? access?.allowed : remembered));

  // Without an answer (slow or no internet) the check is tried again, and an admin who was already in stays in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const result = await checkAdminAccess();
      if (cancelled) return;
      if (result === "unknown") {
        retry = setTimeout(check, 5000);
        return;
      }
      setAccess({ userId: user.id, allowed: result === "admin" });
    };
    void check();
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [user]);

  const waitingForAccess = Boolean(user && !checked && !remembered);

  // The admin app signs the panel in with the email and password typed in the app, so the admin signs in once.
  useEffect(() => {
    if (!isInApp()) return;
    const app = window as unknown as { premiumStoreSignIn?: typeof adminSignIn };
    app.premiumStoreSignIn = adminSignIn;
    return () => {
      delete app.premiumStoreSignIn;
    };
  }, []);

  // The sync runs only while the panel is open; whenever the sign-in screen shows it stops,
  // so the next sign-in always loads everything fresh.
  useEffect(() => {
    if (allowed) void startSync("admin");
    else if (!checking && !waitingForAccess) void stopSync();
  }, [allowed, checking, waitingForAccess]);

  // If the data has not come after a while, offer a way out instead of a screen that never changes.
  const [slowLoad, setSlowLoad] = useState(false);
  const loading = allowed && !state.loaded;
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlowLoad(true), 10_000);
    return () => {
      clearTimeout(timer);
      setSlowLoad(false);
    };
  }, [loading]);

  const signOut = async () => {
    await adminSignOut();
    await stopSync();
  };

  if (checking || waitingForAccess || loading) {
    return (
      <div className="admin-app min-h-dvh grid place-items-center text-center px-6 text-[14px] text-zinc-500">
        <div>
          Loading admin panel…
          {(waitingForAccess || slowLoad) && <div className="mt-1 text-[12.5px] text-zinc-400">If this takes long, please check your internet connection.</div>}
          {slowLoad && (
            <button onClick={signOut} className="mt-4 h-10 px-5 rounded-xl bg-[#0C2660] text-white text-[13.5px] font-semibold">
              Sign in again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!allowed) return <LoginScreen />;
  return (
    <>
      <AdminShell onSignOut={() => setConfirmingSignOut(true)} />
      {confirmingSignOut && (
        <ConfirmDialog
          title="Sign out?"
          message="You will need your email and password to open the admin panel again."
          confirmLabel="Sign out"
          onConfirm={async () => {
            await signOut();
            setConfirmingSignOut(false);
          }}
          onCancel={() => setConfirmingSignOut(false)}
        />
      )}
    </>
  );
}
