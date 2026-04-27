"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "otp-send" | "otp-verify" | "reset";
type Status = "idle" | "loading" | "error" | "reset-sent";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) setMode("otp-send");
  }, []);

  function reset(m: Mode) {
    setMode(m);
    setStatus("idle");
    setErrorMsg("");
  }

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      window.location.href = "/";
    }
  }

  async function handleOtpSend(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("idle");
      setMode("otp-verify");
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
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

  const inputClass =
    "w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] px-5 py-4 text-base placeholder:text-muted focus:outline-none focus:border-white/40";
  const primaryBtn =
    "w-full rounded-2xl bg-white text-black font-medium px-5 py-4 disabled:opacity-50 hover:opacity-90 transition-opacity";
  const loading = status === "loading";

  if (status === "reset-sent") {
    return (
      <div className="rounded-2xl bg-white text-black p-6 text-center space-y-2">
        <p className="font-medium">Länk skickad!</p>
        <p className="text-sm opacity-70">
          Kolla din mail ({email}) och klicka på länken.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google — hide in standalone mode */}
      {!isStandalone && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
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
        </>
      )}

      {/* Mode toggle tabs */}
      <div className="flex rounded-2xl bg-[var(--card)] border border-[var(--card-border)] p-1 gap-1">
        <button
          type="button"
          onClick={() => reset("otp-send")}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            mode === "otp-send" || mode === "otp-verify"
              ? "bg-white text-black"
              : "text-muted hover:text-white"
          }`}
        >
          Engångskod
        </button>
        <button
          type="button"
          onClick={() => reset("password")}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            mode === "password" || mode === "reset"
              ? "bg-white text-black"
              : "text-muted hover:text-white"
          }`}
        >
          Lösenord
        </button>
      </div>

      {/* OTP send */}
      {mode === "otp-send" && (
        <form onSubmit={handleOtpSend} className="space-y-3">
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
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? "Skickar…" : "Skicka kod till min e-post"}
          </button>
        </form>
      )}

      {/* OTP verify */}
      {mode === "otp-verify" && (
        <form onSubmit={handleOtpVerify} className="space-y-3">
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--card-border)] px-5 py-3 text-sm text-muted text-center">
            Kod skickad till <span className="text-white">{email}</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            placeholder="6-siffrig kod"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} tracking-[0.4em] text-center text-xl`}
          />
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? "Verifierar…" : "Logga in"}
          </button>
          <button
            type="button"
            onClick={() => reset("otp-send")}
            className="text-sm text-muted hover:text-white block w-full text-center"
          >
            ← Ändra e-post
          </button>
        </form>
      )}

      {/* Password */}
      {mode === "password" && (
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
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? "Loggar in…" : "Logga in"}
          </button>
          <button
            type="button"
            onClick={() => reset("reset")}
            className="text-sm text-muted hover:text-white block w-full text-center pt-1"
          >
            Glömt lösenord?
          </button>
        </form>
      )}

      {/* Reset */}
      {mode === "reset" && (
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
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? "Skickar…" : "Skicka återställningslänk"}
          </button>
          <button
            type="button"
            onClick={() => reset("password")}
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
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.333z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
    </svg>
  );
}
