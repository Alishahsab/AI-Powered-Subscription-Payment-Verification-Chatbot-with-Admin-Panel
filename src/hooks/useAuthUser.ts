"use client";

import { useEffect, useState } from "react";
import { isAuthApiError, type User } from "@supabase/supabase-js";
import { getSupabase, type AppRole } from "@/lib/supabase/client";

export function useAuthUser(role: AppRole) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const auth = getSupabase(role).auth;

    const restoreSession = async () => {
      const { data } = await auth.getSession();
      if (!data.session) {
        setChecking(false);
        return;
      }

      // The saved sign-in opens the app right away; the server check runs alongside, and an expired
      // or revoked sign-in still goes back to the sign-in screen.
      setUser(data.session.user);
      setChecking(false);
      const { error } = await auth.getUser();
      if (error && isAuthApiError(error) && error.status >= 400 && error.status < 500) {
        await auth.signOut({ scope: "local" });
        setUser(null);
      }
    };

    restoreSession();

    const { data } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [role]);

  return { user, checking };
}
