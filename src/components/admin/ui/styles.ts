export const inputClass =
  "w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13.5px] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition placeholder:text-zinc-400";

export const textareaClass = inputClass + " h-auto py-2 leading-relaxed";

const actionBase = "h-10 rounded-xl text-[13.5px] font-semibold flex items-center justify-center transition";

// Every card action uses one of two looks: the main action filled, the others outlined.
export const actionButton = {
  primary: `${actionBase} bg-[#0C2660] hover:bg-[#0a1f52] text-white`,
  neutral: `${actionBase} border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`,
};
