"use client";

import { useState } from "react";
import GuideSheet, { guideTitles, type Guide } from "../sheets/GuideSheet";
import BackToMenuButton from "./BackToMenuButton";
import { secondaryButtonClass } from "./buttonStyles";

export default function CodeDeliveredActions({ customerId }: { customerId: string }) {
  const [guide, setGuide] = useState<Guide | null>(null);

  return (
    <div className="max-w-[560px] mx-auto">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setGuide("usage")} className={`${secondaryButtonClass} text-[var(--accent)]`}>
          {guideTitles.usage}
        </button>
        <button onClick={() => setGuide("next_time")} className={`${secondaryButtonClass} text-[var(--accent)]`}>
          {guideTitles.next_time}
        </button>
      </div>
      <BackToMenuButton customerId={customerId} />
      {guide && <GuideSheet guide={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}
