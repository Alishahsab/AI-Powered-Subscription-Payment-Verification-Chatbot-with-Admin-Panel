"use client";

import { useRef, useState } from "react";
import { GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { compressImage } from "@/lib/browser";
import { classNames, createId } from "@/lib/format";
import { uploadGuideImage } from "@/lib/supabase/guides";
import type { GuideStep } from "@/lib/types";
import { limits } from "@/lib/validation";
import { inputClass } from "../ui/styles";

type GuideStepsEditorProps = {
  steps: GuideStep[];
  onChange: (steps: GuideStep[]) => void;
};

export default function GuideStepsEditor({ steps, onChange }: GuideStepsEditorProps) {
  const [dragging, setDragging] = useState<number | null>(null);

  const update = (index: number, change: Partial<GuideStep>) => onChange(steps.map((step, position) => (position === index ? { ...step, ...change } : step)));
  const remove = (index: number) => onChange(steps.filter((_, position) => position !== index));

  const dropOn = (target: number) => {
    if (dragging === null || dragging === target) return;
    const next = [...steps];
    const [moved] = next.splice(dragging, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragging(null);
  };

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          draggable
          onDragStart={() => setDragging(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropOn(index)}
          onDragEnd={() => setDragging(null)}
          className={classNames("flex items-start gap-1.5", dragging === index && "opacity-40")}
        >
          <span className="mt-2 cursor-grab text-zinc-300 hover:text-zinc-500" title="Drag to reorder">
            <GripVertical size={16} />
          </span>
          <span className="mt-1.5 size-6 shrink-0 rounded-full bg-[#0C2660] text-white text-[11.5px] font-bold grid place-items-center">{index + 1}</span>
          <div className="flex-1 min-w-0 space-y-1.5">
            <input value={step.text} maxLength={limits.questionMax} onChange={(event) => update(index, { text: event.target.value })} className={inputClass} placeholder="Describe this step" />
            {step.image && (
              <div className="relative inline-block">
                <img src={step.image} alt={`Step ${index + 1}`} className="h-20 rounded-lg border border-zinc-200 object-cover" />
                <button type="button" onClick={() => update(index, { image: undefined })} className="absolute -top-2 -right-2 size-5 rounded-full bg-zinc-900 text-white grid place-items-center" aria-label="Remove image">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
          <AttachButton onUploaded={(image) => update(index, { image })} />
          <button type="button" onClick={() => remove(index)} className="mt-0.5 size-8 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete step">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...steps, { id: createId(), text: "" }])}
        className="h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12.5px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 flex items-center gap-1.5"
      >
        <Plus size={13} /> Add step
      </button>
    </div>
  );
}

function AttachButton({ onUploaded }: { onUploaded: (image: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);

  const upload = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    setFailed(false);
    try {
      onUploaded(await uploadGuideImage(await compressImage(file)));
    } catch {
      setFailed(true);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => upload(event.target.files?.[0])} />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className={classNames("mt-0.5 size-8 shrink-0 grid place-items-center rounded-lg hover:bg-zinc-100 disabled:opacity-40", failed ? "text-red-500" : "text-zinc-400 hover:text-zinc-700")}
        aria-label="Attach an image"
        title={failed ? "Upload failed, try again" : "Attach an image"}
      >
        <ImagePlus size={15} />
      </button>
    </>
  );
}
