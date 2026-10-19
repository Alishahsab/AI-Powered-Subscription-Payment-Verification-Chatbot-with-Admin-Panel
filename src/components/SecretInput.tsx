"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type SecretInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export default function SecretInput({ className = "", ...props }: SecretInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-1.5 bottom-1.5 size-9 grid place-items-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition"
        aria-label={visible ? "Hide" : "Show"}
        title={visible ? "Hide" : "Show"}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
