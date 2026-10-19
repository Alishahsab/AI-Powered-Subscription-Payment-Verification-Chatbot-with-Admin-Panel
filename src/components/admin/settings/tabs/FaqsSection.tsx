import { Trash2 } from "lucide-react";
import { createId } from "@/lib/format";
import { limits } from "@/lib/validation";
import Button from "../../ui/Button";
import { inputClass, textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { SettingsSection } from "../SettingsSection";

export default function FaqsSection({ draft, updateDraft }: SettingsTabProps) {
  const addQuestion = () => {
    updateDraft((next) => {
      next.faqs.push({ id: createId(), question: "", answer: "" });
    });
  };

  const removeQuestion = (index: number) => {
    updateDraft((next) => {
      next.faqs.splice(index, 1);
    });
  };

  return (
    <SettingsSection
      title="FAQs"
      description={`${draft.faqs.length} questions shown under Customer Support`}
      action={
        <Button size="sm" onClick={addQuestion}>
          Add question
        </Button>
      }
    >
      <div className="space-y-3">
        {draft.faqs.map((faq, index) => (
          <div key={faq.id} className="rounded-xl border border-zinc-200 p-3.5 flex items-start gap-3">
            <span className="mt-2 size-6 shrink-0 rounded-md bg-zinc-100 text-zinc-600 text-[12px] font-semibold grid place-items-center">{index + 1}</span>
            <div className="flex-1 space-y-2">
              <input value={faq.question} maxLength={limits.questionMax} placeholder="Question" onChange={(event) => updateDraft((next) => (next.faqs[index].question = event.target.value))} className={`${inputClass} font-medium`} />
              <textarea rows={2} maxLength={limits.longTextMax} value={faq.answer} placeholder="Answer" onChange={(event) => updateDraft((next) => (next.faqs[index].answer = event.target.value))} className={textareaClass} />
            </div>
            <button onClick={() => removeQuestion(index)} className="size-9 shrink-0 grid place-items-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50" aria-label="Remove question">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
