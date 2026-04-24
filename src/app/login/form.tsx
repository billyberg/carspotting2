"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-white text-black p-6 text-center space-y-2">
        <p className="font-medium">Länk skickad!</p>
        <p className="text-sm opacity-70">
          Kolla din mail ({email}) och klicka på länken för att logga in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        autoFocus
        placeholder="din@email.se"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] px-5 py-4 text-base placeholder:text-muted focus:outline-none focus:border-white/40"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-2xl bg-white text-black font-medium px-5 py-4 disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {status === "sending" ? "Skickar…" : "Skicka inloggningslänk"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400 text-center">{errorMsg}</p>
      )}
    </form>
  );
}
