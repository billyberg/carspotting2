import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/web-push"
import webpush from "npm:web-push";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET")!;

webpush.setVapidDetails(
  "mailto:noreply@carspotting.app",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Verify internal secret so only our server can call this
  const secret = req.headers.get("x-internal-secret");
  if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { profileId, newPlate, finderName } = await req.json() as {
    profileId: string;
    newPlate: number;
    finderName: string;
  };

  // Fetch all subscriptions except the finder's own profile
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, profile_id, profiles(notification_pref)")
    .neq("profile_id", profileId);

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // For overtakes: find profiles whose current highest plate = newPlate - 1
  // (they were tied with the finder before this find, now the finder is ahead)
  const { data: overtakenRows } = await supabase
    .from("leaderboard")
    .select("id")
    .eq("highest_plate", newPlate - 1);

  const overtakenIds = new Set((overtakenRows ?? []).map((r) => r.id));

  const sends: Promise<unknown>[] = [];

  for (const sub of subs) {
    const pref = (sub.profiles as { notification_pref: string } | null)
      ?.notification_pref ?? "none";
    if (pref === "none") continue;

    let body = "";
    if (pref === "all") {
      body = `${finderName} hittade ${newPlate}!`;
    } else if (pref === "overtakes") {
      if (!overtakenIds.has(sub.profile_id)) continue;
      body = `${finderName} gick om dig! (${newPlate})`;
    }

    sends.push(
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "Carspotting", body }),
        )
        .catch(() => {
          /* ignore individual failures — stale subscriptions etc */
        }),
    );
  }

  await Promise.all(sends);

  return new Response(JSON.stringify({ ok: true, sent: sends.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
