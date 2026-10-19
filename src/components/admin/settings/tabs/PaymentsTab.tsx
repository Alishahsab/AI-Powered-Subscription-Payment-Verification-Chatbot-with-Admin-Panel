import { cleanAccountNumber, cleanDigits, cleanLetters, cleanLettersAndDigits, limits } from "@/lib/validation";
import Toggle from "../../ui/Toggle";
import { inputClass, textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";
import StepsEditor from "../StepsEditor";

export default function PaymentsTab({ draft, updateDraft }: SettingsTabProps) {
  const { bank } = draft.settings;

  return (
    <>
      <SettingsSection title="Plans & pricing" description="Hidden plans are not shown to customers.">
        <div className="divide-y divide-zinc-100 -my-2">
          {draft.plans.map((plan, index) => (
            <div key={plan.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="w-40">
                <input value={plan.name} onChange={(event) => updateDraft((next) => (next.plans[index].name = cleanLettersAndDigits(event.target.value)))} className={inputClass} />
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">Rs</span>
                <input
                  value={String(plan.price)}
                  inputMode="numeric"
                  onChange={(event) => updateDraft((next) => (next.plans[index].price = Number(cleanDigits(event.target.value, 6)) || 0))}
                  className={`${inputClass} pl-9`}
                />
              </div>
              <div className="ml-auto">
                <Toggle on={plan.active} onChange={(value) => updateDraft((next) => (next.plans[index].active = value))} label={plan.active ? "Visible" : "Hidden"} />
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Bank account" description="The account customers pay into. A change applies to new orders only; orders already created keep the account they were shown.">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Bank name">
            <input value={bank.bankName} onChange={(event) => updateDraft((next) => (next.settings.bank.bankName = cleanLetters(event.target.value)))} className={inputClass} />
          </Field>
          <Field label="Account title">
            <input value={bank.accountTitle} onChange={(event) => updateDraft((next) => (next.settings.bank.accountTitle = cleanLetters(event.target.value)))} className={inputClass} />
          </Field>
          <Field label="Account number" hint={`${limits.accountNumberMin} to ${limits.accountNumberMax} digits`}>
            <input
              value={bank.accountNumber}
              inputMode="numeric"
              onChange={(event) => updateDraft((next) => (next.settings.bank.accountNumber = cleanAccountNumber(event.target.value)))}
              className={`${inputClass} tabular-nums`}
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Payment methods" description="Customers see the steps when they tap How to pay. Use {bank}, {account} and {title} to insert the account details of their order.">
        <div className="space-y-4">
          {draft.methods.map((method, index) => (
            <div key={method.id} className="rounded-xl border border-zinc-200 p-3.5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <input value={method.name} onChange={(event) => updateDraft((next) => (next.methods[index].name = cleanLetters(event.target.value, 20)))} className={`${inputClass} font-medium`} />
                </div>
                <div className="ml-auto">
                  <Toggle on={method.active} onChange={(value) => updateDraft((next) => (next.methods[index].active = value))} label={method.active ? "Shown" : "Hidden"} />
                </div>
              </div>
              <StepsEditor value={method.steps} onChange={(steps) => updateDraft((next) => (next.methods[index].steps = steps))} />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="How does it work?" description="Answer shown when a customer taps How does it work? before ordering.">
        <textarea rows={5} maxLength={limits.longTextMax} value={draft.settings.howItWorks} onChange={(event) => updateDraft((next) => (next.settings.howItWorks = event.target.value))} className={textareaClass} />
      </SettingsSection>

      <SettingsSection title="Sending the code" description="The customer gets a card with the code, a Copy code button and two buttons that open the instructions below.">
        <div className="space-y-4">
          <Field label="Message above the code" hint="{plan} {order_id}">
            <textarea rows={3} maxLength={limits.longTextMax} value={draft.settings.codeMessage} onChange={(event) => updateDraft((next) => (next.settings.codeMessage = event.target.value))} className={textareaClass} />
          </Field>
          <Field label="How to activate it" hint="One step per line">
            <textarea rows={5} maxLength={limits.longTextMax} value={draft.settings.activationGuide} onChange={(event) => updateDraft((next) => (next.settings.activationGuide = event.target.value))} className={textareaClass} />
          </Field>
          <Field label="Instructions for next time" hint="One point per line">
            <textarea rows={4} maxLength={limits.longTextMax} value={draft.settings.nextTimeGuide} onChange={(event) => updateDraft((next) => (next.settings.nextTimeGuide = event.target.value))} className={textareaClass} />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Rejecting a payment" description="The customer can reply a limited number of times, then waits for you. Use {reason} and {order_id}.">
        <div className="space-y-4">
          <Field label="Rejection message">
            <textarea rows={3} maxLength={limits.longTextMax} value={draft.settings.rejectionMessage} onChange={(event) => updateDraft((next) => (next.settings.rejectionMessage = event.target.value))} className={textareaClass} />
          </Field>
          <Field label="Reasons to choose from" hint="One per line">
            <textarea rows={4} maxLength={limits.longTextMax} value={draft.settings.rejectReasons.join("\n")} onChange={(event) => updateDraft((next) => (next.settings.rejectReasons = event.target.value.split("\n")))} className={textareaClass} />
          </Field>
          <Field label="Message while waiting for you">
            <textarea rows={2} maxLength={limits.longTextMax} value={draft.settings.waitForAdminMessage} onChange={(event) => updateDraft((next) => (next.settings.waitForAdminMessage = event.target.value))} className={textareaClass} />
          </Field>
        </div>
      </SettingsSection>
    </>
  );
}
