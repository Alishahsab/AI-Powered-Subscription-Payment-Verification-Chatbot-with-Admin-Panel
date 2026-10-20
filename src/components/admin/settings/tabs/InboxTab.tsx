"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { classNames } from "@/lib/format";
import { cleanEmail, limits } from "@/lib/validation";
import { inputClass, textareaClass } from "../../ui/styles";
import QuickRepliesEditor from "../QuickRepliesEditor";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";

export default function InboxTab({ draft, updateDraft }: SettingsTabProps) {
  const { inboxTabs, blocking } = draft.settings;
  const [dragging, setDragging] = useState<number | null>(null);

  const dropOn = (target: number) => {
    if (dragging === null || dragging === target) return;
    updateDraft((next) => {
      const [moved] = next.settings.inboxTabs.splice(dragging, 1);
      next.settings.inboxTabs.splice(target, 0, moved);
    });
    setDragging(null);
  };

  return (
    <>
      <SettingsSection title="Inbox tabs" description="Rename the tabs and drag them into the order you want.">
        <div className="space-y-2">
          {inboxTabs.map((tab, index) => (
            <div
              key={tab.key}
              draggable
              onDragStart={() => setDragging(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(index)}
              onDragEnd={() => setDragging(null)}
              className={classNames("flex items-center gap-2", dragging === index && "opacity-40")}
            >
              <span className="cursor-grab text-zinc-300 hover:text-zinc-500" title="Drag to reorder">
                <GripVertical size={16} />
              </span>
              <span className="size-6 shrink-0 rounded-full bg-[#0C2660] text-white text-[11.5px] font-bold grid place-items-center">{index + 1}</span>
              <div className="flex-1 max-w-xs">
                <input value={tab.label} maxLength={24} onChange={(event) => updateDraft((next) => (next.settings.inboxTabs[index].label = event.target.value))} className={inputClass} />
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Quick replies" description="Ready-made replies you can send from the chat with the quick replies button next to the image button. Use the arrows to change the order.">
        <QuickRepliesEditor replies={draft.settings.quickReplies} onChange={(replies) => updateDraft((next) => (next.settings.quickReplies = replies))} />
      </SettingsSection>

      <SettingsSection title="Blocking" description="What a blocked customer sees, and the reasons you can pick when you block someone.">
        <div className="space-y-4">
          <Field label="Message for blocked customers" hint="The reason you choose is shown under it">
            <textarea rows={2} maxLength={limits.longTextMax} value={blocking.message} onChange={(event) => updateDraft((next) => (next.settings.blocking.message = event.target.value))} className={textareaClass} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Email button text">
              <input value={blocking.channelLabel} maxLength={40} onChange={(event) => updateDraft((next) => (next.settings.blocking.channelLabel = event.target.value))} className={inputClass} />
            </Field>
            <Field label="Support email" hint="Leave empty to hide the button">
              <input type="email" value={blocking.channelUrl} maxLength={80} placeholder="support@example.com" onChange={(event) => updateDraft((next) => (next.settings.blocking.channelUrl = cleanEmail(event.target.value)))} className={inputClass} />
            </Field>
          </div>
          <Field label="Block reasons" hint="One per line">
            <textarea rows={4} maxLength={limits.longTextMax} value={blocking.reasons.join("\n")} onChange={(event) => updateDraft((next) => (next.settings.blocking.reasons = event.target.value.split("\n")))} className={textareaClass} />
          </Field>
        </div>
      </SettingsSection>
    </>
  );
}
