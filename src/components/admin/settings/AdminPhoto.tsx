"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Trash2, UserRound } from "lucide-react";
import { avatarProblem, avatarUrl, removeAdminAvatar, uploadAdminAvatar, type AdminProfile } from "@/lib/supabase/adminProfile";
import Modal from "../ui/Modal";

type AdminPhotoProps = {
  profile: AdminProfile | null;
  onChange: (avatarPath: string | null) => void;
};

export default function AdminPhoto({ profile, onChange }: AdminPhotoProps) {
  const [open, setOpen] = useState(false);
  const url = avatarUrl(profile?.avatarPath ?? null);

  return (
    <div className="relative z-10 mx-auto size-32">
      <div className="size-32 overflow-hidden rounded-full border-4 border-white bg-[linear-gradient(135deg,#1B3A85,#0C2660)] shadow-[0_18px_40px_-18px_rgba(12,38,96,0.6)] grid place-items-center">
        {url ? <img src={url} alt="Profile photo" className="size-full object-cover" /> : <UserRound size={64} className="text-[#D4A551]" />}
      </div>
      <button
        onClick={() => setOpen(true)}
        disabled={!profile}
        className="absolute right-0.5 bottom-1.5 size-[38px] rounded-full border-[3px] border-white bg-[#D4A551] text-[#0C2660] grid place-items-center"
        aria-label="Change profile photo"
      >
        <Camera size={17} strokeWidth={2.2} />
      </button>
      {open && profile && <PhotoDialog profile={profile} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

function PhotoDialog({ profile, onChange, onClose }: { profile: AdminProfile; onChange: (avatarPath: string | null) => void; onClose: () => void }) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (task: () => Promise<string | null>) => {
    setBusy(true);
    setError("");
    try {
      onChange(await task());
      onClose();
    } catch {
      setError("The photo could not be saved. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  };

  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = avatarProblem(file);
    if (problem) return setError(problem);
    run(() => uploadAdminAvatar(profile, file));
  };

  const option = "flex flex-col items-center gap-1.5 text-[12px] font-bold text-zinc-700 disabled:opacity-40";
  const tile = "size-14 rounded-[18px] grid place-items-center";

  return (
    <Modal title="Profile photo" description="JPG, PNG or WebP · up to 2 MB" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2.5">
        <button onClick={() => cameraInput.current?.click()} disabled={busy} className={option}>
          <span className={`${tile} bg-[#eef1f7] text-[#0C2660]`}><Camera size={22} /></span>
          Camera
        </button>
        <button onClick={() => galleryInput.current?.click()} disabled={busy} className={option}>
          <span className={`${tile} bg-[#eef1f7] text-[#0C2660]`}><ImageIcon size={22} /></span>
          Gallery
        </button>
        <button onClick={() => run(async () => (await removeAdminAvatar(profile), null))} disabled={busy || !profile.avatarPath} className={option}>
          <span className={`${tile} bg-red-50 text-red-600`}><Trash2 size={22} /></span>
          Remove
        </button>
      </div>

      <input ref={cameraInput} type="file" accept="image/*" capture="user" onChange={pick} className="hidden" />
      <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />

      {busy && <p className="mt-4 text-[12.5px] text-zinc-500">Saving photo…</p>}
      {error && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">{error}</p>}
    </Modal>
  );
}
