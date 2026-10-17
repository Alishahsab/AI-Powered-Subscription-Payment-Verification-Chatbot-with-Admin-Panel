import { classNames } from "@/lib/format";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
};

const variants = {
  primary: "bg-[#0C2660] text-white hover:bg-[#0a1f52]",
  secondary: "bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50",
  ghost: "text-zinc-600 hover:bg-zinc-100",
  danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

export default function Button({ variant = "secondary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={classNames(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-3.5 text-[13.5px]",
        variants[variant],
        className
      )}
    />
  );
}
