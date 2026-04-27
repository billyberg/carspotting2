"use client";

import { useState, useEffect } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
  updateNotificationPref,
} from "@/app/actions";

type Pref = "all" | "overtakes" | "none";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Convert base64url VAPID key to the Uint8Array browsers require */
function vapidKeyToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

const PREFS = [
  { value: "overtakes" as Pref, label: "Någon går om mig i topplistan" },
  { value: "all" as Pref, label: "Någon hittar ett nytt nummer" },
];

export function NotificationSettings({ initialPref }: { initialPref: Pref }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pref, setPref] = useState<Pref>(initialPref);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [permDenied, setPermDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setChecking(false);
      return;
    }
    setSupported(true);
    if ("Notification" in window && Notification.permission === "denied") {
      setPermDenied(true);
      setChecking(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(!!sub);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function subscribe() {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Ensure SW is registered (may not be if SwInit hadn't fired yet)
      await navigator.serviceWorker.register("/sw.js");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") setPermDenied(true);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyToUint8Array(VAPID_KEY),
      });

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Subscription saknar nycklar");
      }

      const result = await savePushSubscription({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });

      if (!result.ok) throw new Error(result.error);

      setSubscribed(true);
      if (pref === "none") {
        setPref("overtakes");
        await updateNotificationPref("overtakes");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  async function changePref(newPref: Pref) {
    setPref(newPref);
    await updateNotificationPref(newPref);
  }

  if (!supported || checking) return null;

  return (
    <section className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-5 space-y-4">
      <h2 className="text-sm uppercase tracking-widest text-muted">Notiser</h2>

      {permDenied ? (
        <p className="text-sm text-muted">
          Du har blockerat notiser i webbläsaren. Tillåt dem i inställningarna
          för att aktivera.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Push-notiser</span>
            <button
              onClick={subscribed ? unsubscribe : subscribe}
              disabled={loading}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${
                subscribed
                  ? "border border-[var(--card-border)] text-muted hover:text-white"
                  : "bg-white text-black hover:opacity-90"
              }`}
            >
              {loading ? "…" : subscribed ? "Avaktivera" : "Aktivera"}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 break-all">{errorMsg}</p>
          )}

          {subscribed && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted">Notifiera mig när:</p>
              {PREFS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-2xl bg-black/40 border border-[var(--card-border)] px-4 py-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="notif_pref"
                    value={opt.value}
                    checked={pref === opt.value}
                    onChange={() => changePref(opt.value)}
                    className="accent-white"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
