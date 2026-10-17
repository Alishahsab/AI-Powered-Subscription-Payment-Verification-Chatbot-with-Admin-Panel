type ToggleProps = {
  on: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

export default function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} className="inline-flex items-center gap-2 text-[13px] text-zinc-700">
      <span className={`relative w-9 h-5 rounded-full transition ${on ? "bg-emerald-500" : "bg-zinc-300"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}
