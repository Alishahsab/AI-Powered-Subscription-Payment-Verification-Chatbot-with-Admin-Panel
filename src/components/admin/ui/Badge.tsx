type BadgeTone = "gray" | "green" | "amber" | "red" | "blue";

const tones: Record<BadgeTone, string> = {
  gray: "bg-zinc-100 text-zinc-600",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
};

export default function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md ${tones[tone]}`}>{children}</span>;
}
