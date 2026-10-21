export const inputClass =
  "w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13.5px] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition placeholder:text-zinc-400";

export const textareaClass = inputClass + " h-auto py-2 leading-relaxed";

const actionBase = "h-10 rounded-xl text-[13.5px] font-semibold flex items-center justify-center transition";

export const actionButton = {
  primary: `${actionBase} bg-[#0C2660] hover:bg-[#0a1f52] text-white`,
  success: `${actionBase} bg-emerald-600 hover:bg-emerald-700 text-white`,
  danger: `${actionBase} border border-red-200 text-red-600 hover:bg-red-50`,
  neutral: `${actionBase} border border-zinc-200 text-zinc-700 hover:bg-zinc-50`,
  warning: `${actionBase} border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100`,
};
