"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { inputClass } from "../ui/styles";

const MAX_REPLY_LENGTH = 300;

type QuickRepliesEditorProps = {
  replies: string[];
  onChange: (replies: string[]) => void;
};

export default function QuickRepliesEditor({ replies, onChange }: QuickRepliesEditorProps) {
  const update = (index: number, text: string) => onChange(replies.map((reply, position) => (position === index ? text : reply)));
  const remove = (index: number) => onChange(replies.filter((_, position) => position !== index));
  const move = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= replies.length) return;
    const next = [...replies];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const iconButton = "size-8 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="space-y-2">
      {replies.length === 0 && <div className="text-[12.5px] text-zinc-400">No quick replies yet.</div>}
      {replies.map((reply, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="size-6 shrink-0 rounded-full bg-[#0C2660] text-white text-[11.5px] font-bold grid place-items-center">{index + 1}</span>
          <textarea
            rows={1}
            value={reply}
            maxLength={MAX_REPLY_LENGTH}
            onChange={(event) => update(index, event.target.value.replace(/\n/g, " "))}
            className={`${inputClass} h-auto min-h-9 py-2 leading-snug resize-none field-sizing-content`}
            placeholder="Type a quick reply"
          />
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={iconButton} aria-label="Move up">
            <ChevronUp size={16} />
          </button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === replies.length - 1} className={iconButton} aria-label="Move down">
            <ChevronDown size={16} />
          </button>
          <button type="button" onClick={() => remove(index)} className="size-8 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete reply">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...replies, ""])} className="h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12.5px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50">
        Add reply
      </button>
    </div>
  );
}
