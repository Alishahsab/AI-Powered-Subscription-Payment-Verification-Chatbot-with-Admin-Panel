import Toggle from "../../ui/Toggle";
import { inputClass, textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";

export default function PaymentsTab({ draft, updateDraft }: SettingsTabProps) {
  const { bank } = draft.settings;

  return (
    <>
      <SettingsSection title="Plans & pricing" description="Hidden plans are not shown to customers.">
        <div className="divide-y divide-zinc-100 -my-2">
          {draft.plans.map((plan, index) => (
            <div key={plan.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="w-40">
                <input value={plan.name} onChange={(event) => updateDraft((next) => (next.plans[index].name = event.target.value))} className={inputClass} />
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">Rs</span>
                <input
                  value={String(plan.price)}
                  inputMode="numeric"
                  onChange={(event) => updateDraft((next) => (next.plans[index].price = Number(event.target.value.replace(/\D/g, "")) || 0))}
                  className={`${inputClass} pl-9`}
                />
              </div>
              <span className="text-[12.5px] text-zinc-500">Rs {Math.round(plan.price / plan.months)} per month</span>
              <div className="ml-auto">
                <Toggle on={plan.active} onChange={(value) => updateDraft((next) => (next.plans[index].active = value))} label={plan.active ? "Visible" : "Hidden"} />
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Bank account" description="The only account customers pay into, whichever method they choose. Change it here when a limit is reached.">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Bank name">
            <input value={bank.bankName} onChange={(event) => updateDraft((next) => (next.settings.bank.bankName = event.target.value))} className={inputClass} />
          </Field>
          <Field label="Account title">
            <input value={bank.accountTitle} onChange={(event) => updateDraft((next) => (next.settings.bank.accountTitle = event.target.value))} className={inputClass} />
          </Field>
          <Field label="Account number">
            <input value={bank.accountNumber} onChange={(event) => updateDraft((next) => (next.settings.bank.accountNumber = event.target.value))} className={`${inputClass} tabular-nums`} />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Payment methods" description="Shown to customers so they know which apps work. Steps appear automatically when filled in; use {bank}, {account} and {title}.">
        <div className="space-y-4">
          {draft.methods.map((method, index) => (
            <div key={method.id} className="rounded-xl border border-zinc-200 p-3.5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <input value={method.name} onChange={(event) => updateDraft((next) => (next.methods[index].name = event.target.value))} className={`${inputClass} font-medium`} />
                </div>
                <div className="ml-auto">
                  <Toggle on={method.active} onChange={(value) => updateDraft((next) => (next.methods[index].active = value))} label={method.active ? "Shown" : "Hidden"} />
                </div>
              </div>
              <textarea
                rows={method.steps ? 5 : 2}
                value={method.steps}
                placeholder="No steps for this method"
                onChange={(event) => updateDraft((next) => (next.methods[index].steps = event.target.value))}
                className={textareaClass}
              />
            </div>
          ))}
        </div>
      </SettingsSection>
    </>
  );
}
