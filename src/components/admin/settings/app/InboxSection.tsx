"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { cleanEmail } from "@/lib/validation";
import QuickRepliesEditor from "../QuickRepliesEditor";
import { editorPage, listField, messagesPage, type Page, type PageProps, type TextField } from "./pages";
import { appInput, Group, InputField, Row } from "./ui";

const subtitle = "Inbox & blocking";

const blockFields: TextField[] = [
  {
    label: "Message for blocked customers",
    hint: "The reason you choose is shown under it.",
    get: (draft) => draft.settings.blocking.message,
    set: (draft, value) => (draft.settings.blocking.message = value),
  },
  {
    label: "Message when you unblock",
    get: (draft) => draft.settings.blocking.unblockMessage,
    set: (draft, value) => (draft.settings.blocking.unblockMessage = value),
  },
];

const reasons: TextField = {
  label: "Block reasons",
  hint: "The reasons you can pick when you block someone. One per line.",
  ...listField(
    (draft) => draft.settings.blocking.reasons,
    (draft, value) => (draft.settings.blocking.reasons = value)
  ),
};

const emailPage: Page = {
  title: "Email button",
  subtitle,
  render: ({ draft, updateDraft }) => (
    <Group>
      <InputField label="Button text">
        <input value={draft.settings.blocking.channelLabel} maxLength={40} onChange={(event) => updateDraft((next) => (next.settings.blocking.channelLabel = event.target.value))} className={appInput} />
      </InputField>
      <InputField label="Support email" hint="Leave empty to hide the button">
        <input
          type="email"
          value={draft.settings.blocking.channelUrl}
          maxLength={80}
          placeholder="support@example.com"
          onChange={(event) => updateDraft((next) => (next.settings.blocking.channelUrl = cleanEmail(event.target.value)))}
          className={appInput}
        />
      </InputField>
    </Group>
  ),
};

const repliesPage: Page = {
  title: "Quick replies",
  subtitle,
  render: ({ draft, updateDraft }) => (
    <Group plain>
      <div className="p-3.5">
        <p className="mb-3 text-[12px] text-zinc-500">Ready-made replies you can send from the chat with the quick replies button.</p>
        <QuickRepliesEditor replies={draft.settings.quickReplies} onChange={(replies) => updateDraft((next) => (next.settings.quickReplies = replies))} />
      </div>
    </Group>
  ),
};

const arrow = "size-8 shrink-0 rounded-lg bg-[#f3f5fa] text-[#0C2660] grid place-items-center disabled:opacity-30";

export default function InboxSection({ draft, updateDraft, open }: PageProps) {
  const { inboxTabs, blocking, quickReplies } = draft.settings;

  const move = (from: number, to: number) => {
    updateDraft((next) => {
      const [moved] = next.settings.inboxTabs.splice(from, 1);
      next.settings.inboxTabs.splice(to, 0, moved);
    });
  };

  return (
    <>
      <Group title="Inbox tabs · names and order">
        {inboxTabs.map((tab, index) => (
          <div key={tab.key} className="flex items-center gap-2 px-3 py-2">
            <span className="size-6 shrink-0 rounded-full bg-[#0C2660] text-white text-[11px] font-bold grid place-items-center">{index + 1}</span>
            <input
              value={tab.label}
              maxLength={24}
              onChange={(event) => updateDraft((next) => (next.settings.inboxTabs[index].label = event.target.value))}
              className="flex-1 min-w-0 h-9 rounded-lg bg-transparent px-2 text-[13.5px] font-semibold text-zinc-900 outline-none focus:bg-[#f3f5fa]"
            />
            <button onClick={() => move(index, index - 1)} disabled={index === 0} className={arrow} aria-label="Move up">
              <ChevronUp size={16} />
            </button>
            <button onClick={() => move(index, index + 1)} disabled={index === inboxTabs.length - 1} className={arrow} aria-label="Move down">
              <ChevronDown size={16} />
            </button>
          </div>
        ))}
      </Group>

      <Group title="Quick replies">
        <Row title="Quick replies" sub={quickReplies.filter(Boolean).slice(0, 2).join(" · ") || "None yet"} count={quickReplies.length} onClick={() => open(repliesPage)} />
      </Group>

      <Group title="Blocking">
        <Row title="Block & unblock messages" sub="What the customer sees" count={2} onClick={() => open(messagesPage("Block & unblock messages", blockFields, subtitle))} />
        <Row title="Email button" sub={`${blocking.channelLabel}${blocking.channelUrl ? ` · ${blocking.channelUrl}` : " · hidden"}`} onClick={() => open(emailPage)} />
        <div>
          <Row title="Block reasons" count={blocking.reasons.filter((reason) => reason.trim()).length} onClick={() => open(editorPage(reasons, subtitle))} />
          <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5">
          {blocking.reasons
            .filter((reason) => reason.trim())
            .map((reason) => (
              <span key={reason} className="rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-semibold text-red-700">
                {reason}
              </span>
            ))}
          </div>
        </div>
      </Group>
    </>
  );
}
