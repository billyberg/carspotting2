"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error" | "reset-sent";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "reset">("password");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGoogle() {
    setErrorMsg("");
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/return`,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      window.location.href = "/";
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("reset-sent");
    }
  }

  if (status === "reset-sent") {
    return (
      <div className="rounded-2xl bg-white text-black p-6 text-center space-y-2">
        <p className="font-medium">Länk skickad!</p>
        <p className="text-sm opacity-70">
          Kolla din mail ({email}) och klicka på länken för att sätta ett nytt
          lösenord.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] px-5 py-4 text-base placeholder:text-muted focus:outline-none focus:border-white/40";
  const primaryBtn =
    "w-full rounded-2xl bg-white text-black font-medium px-5 py-4 disabled:opacity-50 hover:opacity-90 transition-opacity";

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={status === "loading"}
        className={`${primaryBtn} flex items-center justify-center gap-3`}
      >
        <GoogleIcon />
        <span>Logga in med Google</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--card-border)]" />
        <span className="text-xs text-muted">eller</span>
        <div className="h-px flex-1 bg-[var(--card-border)]" />
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePassword} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className={primaryBtn}
          >
            {status === "loading" ? "Loggar in…" : "Logga in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setStatus("idle");
              setErrorMsg("");
            }}
            className="text-sm text-muted hover:text-white block w-full text-center pt-1"
          >
            Glömt lösenord?
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-3">
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className={primaryBtn}
          >
            {status === "loading" ? "Skickar…" : "Skicka återställningslänk"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setStatus("idle");
              setErrorMsg("");
            }}
            className="text-sm text-muted hover:text-white block w-full text-center pt-1"
          >
            ← Tillbaka
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="text-sm text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.333z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
