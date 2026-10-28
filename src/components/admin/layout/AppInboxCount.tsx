"use client";

import { useEffect } from "react";
import { tellApp } from "@/lib/appMode";
import { useAppState } from "@/lib/store/state";
import { countInboxTabs } from "../inbox/inboxItems";

export default function AppInboxCount() {
  const state = useAppState();
  const counts = countInboxTabs(state);
  const waiting = counts.pending + counts.issues;

  useEffect(() => {
    tellApp(`inbox-count:${waiting}`);
  }, [waiting]);

  return null;
}
