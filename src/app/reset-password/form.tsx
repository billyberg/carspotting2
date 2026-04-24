"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setStatus("error");
      setErrorMsg("Lösenordet måste vara minst 8 tecken");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setErrorMsg("Lösenorden matchar inte");
      return;
    }

    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      window.location.href = "/";
    }
  }

  const inputClass =
    "w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] px-5 py-4 text-base placeholder:text-muted focus:outline-none focus:border-white/40";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        required
        autoFocus
        autoComplete="new-password"
        placeholder="Nytt lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        required
        autoComplete="new-password"
        placeholder="Bekräfta lösenord"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-2xl bg-white text-black font-medium px-5 py-4 disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {status === "loading" ? "Sparar…" : "Spara lösenord"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400 text-center">{errorMsg}</p>
      )}
    </form>
  );
}
