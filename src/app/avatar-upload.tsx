"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./avatar";
import { updateAvatarUrl } from "./actions";

const MAX_MB = 5;

export function AvatarUpload({
  profileId,
  name,
  avatarUrl,
  size = 56,
}: {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Bilden får vara max ${MAX_MB} MB`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Filen måste vara en bild");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profileId}/avatar.${ext}`;
    const supabase = createClient();

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadErr) {
      setError(uploadErr.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBusted = `${publicUrl}?v=${Date.now()}`;

    startTransition(async () => {
      const res = await updateAvatarUrl(profileId, cacheBusted);
      if (!res.ok) setError(res.error);
    });
  }

  async function handleRemove() {
    setError(null);
    startTransition(async () => {
      const res = await updateAvatarUrl(profileId, null);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="relative group rounded-full disabled:opacity-50"
        aria-label="Byt profilbild"
      >
        <Avatar url={avatarUrl} name={name} size={size} />
        <span className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
          Byt
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col gap-1 text-xs">
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="text-muted hover:text-red-400 disabled:opacity-50 text-left"
          >
            Ta bort
          </button>
        )}
        {pending && <span className="text-muted">Laddar upp…</span>}
        {error && <span className="text-red-400 break-words">{error}</span>}
      </div>
    </div>
  );
}
