"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { adminSignOut, checkAdminAccess } from "@/lib/store/admin";
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
  const allowed = Boolean(user && access?.userId === user.id && access.allowed);

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

  useEffect(() => {
    if (allowed) startSync("admin");
  }, [allowed]);

  const signOut = async () => {
    await adminSignOut();
    await stopSync();
  };

  const waitingForAccess = user && access?.userId !== user.id;
  if (checking || waitingForAccess || (allowed && !state.loaded)) {
    return (
      <div className="admin-app min-h-dvh grid place-items-center text-center px-6 text-[14px] text-zinc-500">
        <div>
          Loading admin panel…
          {waitingForAccess && <div className="mt-1 text-[12.5px] text-zinc-400">If this takes long, please check your internet connection.</div>}
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
