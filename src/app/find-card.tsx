"use client";

import { useState, useTransition } from "react";
import { formatPlate } from "@/lib/plate";
import type { Profile } from "@/lib/types";
import { registerFind, undoLastFind } from "./actions";

export function FindCard({
  profile,
  highest,
  isManaged,
}: {
  profile: Profile;
  highest: number;
  isManaged: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = highest + 1;

  function onRegister() {
    setError(null);
    startTransition(async () => {
      const res = await registerFind(profile.id);
      if (!res.ok) setError(res.error);
    });
  }

  function onUndo() {
    setError(null);
    if (!confirm(`Ångra senaste fyndet (${formatPlate(highest)})?`)) return;
    startTransition(async () => {
      const res = await undoLastFind(profile.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="rounded-3xl bg-white text-black p-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60">
            {isManaged ? `${profile.display_name} — senaste` : "Senaste fynd"}
          </div>
          <div className="font-mono text-5xl sm:text-6xl font-semibold tabular-nums mt-1">
            {highest > 0 ? formatPlate(highest) : "—"}
          </div>
        </div>
        {highest > 0 && (
          <button
            onClick={onUndo}
            disabled={pending}
            className="text-xs rounded-full border border-black/20 px-3 py-1.5 hover:bg-black/5 disabled:opacity-40"
          >
            Ångra
          </button>
        )}
      </div>
      <button
        onClick={onRegister}
        disabled={pending}
        className="w-full rounded-2xl bg-black text-white font-medium px-5 py-5 text-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {pending ? "Registrerar…" : `Registrera ${formatPlate(next)}`}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
