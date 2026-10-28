"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { classNames } from "@/lib/format";
import { limits } from "@/lib/validation";
import { inputClass } from "../ui/styles";

type StepsEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function StepsEditor({ value, onChange }: StepsEditorProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [firstStepAdded, setFirstStepAdded] = useState(false);
  const savedSteps = value === "" ? [] : value.split("\n").map((line) => line.replace(/^\s*\d+[.)]\s*/, ""));
  const steps = savedSteps.length === 0 && firstStepAdded ? [""] : savedSteps;
  const save = (next: string[]) => {
    setFirstStepAdded(next.length > 0);
    onChange(next.join("\n"));
  };

  const update = (index: number, text: string) => save(steps.map((step, position) => (position === index ? text.replace(/\n/g, " ") : step)));
  const remove = (index: number) => save(steps.filter((_, position) => position !== index));

  const dropOn = (target: number) => {
    if (dragging === null || dragging === target) return;
    const next = [...steps];
    const [moved] = next.splice(dragging, 1);
    next.splice(target, 0, moved);
    save(next);
    setDragging(null);
  };

  return (
    <div className="space-y-2">
      {steps.length === 0 && <div className="text-[12.5px] text-zinc-400">No steps yet. Customers will not see a Steps button for this method.</div>}
      {steps.map((step, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => setDragging(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropOn(index)}
          onDragEnd={() => setDragging(null)}
          className={classNames("flex items-start gap-1.5 rounded-xl transition", dragging === index && "opacity-40")}
        >
          <span className="mt-2.5 cursor-grab text-zinc-300 hover:text-zinc-500" title="Drag to reorder">
            <GripVertical size={16} />
          </span>
          <span className="mt-1.5 size-6 shrink-0 rounded-full bg-[#0C2660] text-white text-[11.5px] font-bold grid place-items-center">{index + 1}</span>
          <textarea
            rows={1}
            value={step}
            maxLength={limits.questionMax}
            onChange={(event) => update(index, event.target.value)}
            className={`${inputClass} h-auto min-h-9 py-2 leading-snug resize-none field-sizing-content`}
            placeholder="Describe this step"
          />
          <button type="button" onClick={() => remove(index)} className="mt-0.5 size-8 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete step">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => save([...steps, ""])} className="h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12.5px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 flex items-center gap-1.5">
        Add step
      </button>
    </div>
  );
}
