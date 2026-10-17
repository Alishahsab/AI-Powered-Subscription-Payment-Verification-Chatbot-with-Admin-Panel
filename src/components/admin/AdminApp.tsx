"use client";

import { useState } from "react";
import AdminShell from "./AdminShell";
import LoginScreen from "./LoginScreen";

const SESSION_KEY = "premium_store_admin";

function isSignedIn() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdminApp() {
  const [signedIn, setSignedIn] = useState(isSignedIn);

  const signIn = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setSignedIn(true);
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setSignedIn(false);
  };

  if (!signedIn) return <LoginScreen onSignedIn={signIn} />;
  return <AdminShell onSignOut={signOut} />;
}
