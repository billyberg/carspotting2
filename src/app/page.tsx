import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPlate } from "@/lib/plate";
import type { LeaderboardRow, Profile } from "@/lib/types";
import { FindCard } from "./find-card";
import { SignOutButton } from "./sign-out";
import { Avatar } from "./avatar";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();
  if (!ownProfile) redirect("/onboarding");

  const [{ data: managed }, { data: leaderboard }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("managed_by", ownProfile.id)
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    supabase
      .from("leaderboard")
      .select("*")
      .order("highest_plate", { ascending: false })
      .order("display_name", { ascending: true })
      .returns<LeaderboardRow[]>(),
  ]);

  const myProfiles: Profile[] = [ownProfile, ...(managed ?? [])];
  const profileIds = myProfiles.map((p) => p.id);

  const { data: latestFinds } = await supabase
    .from("finds")
    .select("profile_id, plate_number")
    .in("profile_id", profileIds);

  const highestByProfile = new Map<string, number>();
  for (const p of myProfiles) {
    highestByProfile.set(p.id, p.bootstrap_plate ?? 0);
  }
  for (const f of latestFinds ?? []) {
    const current = highestByProfile.get(f.profile_id) ?? 0;
    if (f.plate_number > current)
      highestByProfile.set(f.profile_id, f.plate_number);
  }

  return (
    <main className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-2xl w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-2">
        <h1 className="text-xl font-semibold tracking-tight">Carspotting</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/hantera"
            className="text-sm rounded-full border border-[var(--card-border)] px-4 py-2 hover:border-white/40 transition-colors"
          >
            Hantera
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="space-y-4">
        {myProfiles.map((p) => (
          <FindCard
            key={p.id}
            profile={p}
            highest={highestByProfile.get(p.id) ?? 0}
            isManaged={p.id !== ownProfile.id}
          />
        ))}
      </div>

      <section className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-5">
        <h2 className="text-sm uppercase tracking-widest text-muted mb-4">
          Topplista
        </h2>
        <ol className="space-y-2">
          {(leaderboard ?? []).map((row, i) => {
            const isMine = myProfiles.some((p) => p.id === row.id);
            return (
              <li
                key={row.id}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                  isMine
                    ? "bg-white text-black"
                    : "bg-black/40 border border-[var(--card-border)]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-sm tabular-nums shrink-0 ${
                      isMine ? "opacity-60" : "text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Avatar
                    url={row.avatar_url}
                    name={row.display_name}
                    size={36}
                  />
                  <span className="font-medium truncate">{row.display_name}</span>
                </div>
                <span className="font-mono tabular-nums text-lg shrink-0 pl-2">
                  {formatPlate(row.highest_plate)}
                </span>
              </li>
            );
          })}
          {(leaderboard ?? []).length === 0 && (
            <li className="text-sm text-muted text-center py-6">
              Inga spelare än.
            </li>
          )}
        </ol>
      </section>
    </main>
  );
}
