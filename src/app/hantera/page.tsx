import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { formatPlate } from "@/lib/plate";
import { AvatarUpload } from "@/app/avatar-upload";
import { createFakeProfile, deleteFakeProfile } from "@/app/actions";

export default async function ManagePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();
  if (!ownProfile) redirect("/onboarding");

  const [{ data: fakes }, { data: leaderboard }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("managed_by", ownProfile.id)
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    supabase.from("leaderboard").select("id, highest_plate"),
  ]);

  const highestByProfile = new Map<string, number>();
  for (const f of fakes ?? []) {
    highestByProfile.set(f.id, f.bootstrap_plate ?? 0);
  }
  for (const row of leaderboard ?? []) {
    if (highestByProfile.has(row.id)) {
      highestByProfile.set(row.id, row.highest_plate);
    }
  }

  return (
    <main className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-2xl w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-2">
        <Link
          href="/"
          className="text-sm rounded-full border border-[var(--card-border)] px-4 py-2 hover:border-white/40 transition-colors"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Hantera</h1>
        {ownProfile.is_admin ? (
          <Link
            href="/admin"
            className="text-sm rounded-full bg-white text-black px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Admin
          </Link>
        ) : (
          <div className="w-24" />
        )}
      </header>

      <section className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-5 space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-muted">
          Din profil
        </h2>
        <div className="flex items-center gap-4">
          <AvatarUpload
            profileId={ownProfile.id}
            name={ownProfile.display_name}
            avatarUrl={ownProfile.avatar_url}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{ownProfile.display_name}</div>
            <div className="text-xs text-muted">Klicka på bilden för att byta</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-5 space-y-4">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-muted">
            Lägg till spelare
          </h2>
          <p className="text-xs text-muted mt-1">
            Skapa ett konto du registrerar fynd åt (t.ex. en familjemedlem).
          </p>
        </div>
        <form action={createFakeProfile} className="flex gap-2">
          <input
            type="text"
            name="display_name"
            required
            maxLength={40}
            placeholder="Namn"
            className="flex-1 rounded-2xl bg-black border border-[var(--card-border)] px-4 py-3 text-base placeholder:text-muted focus:outline-none focus:border-white/40"
          />
          <button
            type="submit"
            className="rounded-2xl bg-white text-black font-medium px-5 py-3 hover:opacity-90 transition-opacity"
          >
            Lägg till
          </button>
        </form>
      </section>

      <section className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-5">
        <h2 className="text-sm uppercase tracking-widest text-muted mb-4">
          Dina hanterade spelare
        </h2>
        <ul className="space-y-3">
          {(fakes ?? []).map((f) => {
            const highest = highestByProfile.get(f.id) ?? 0;
            return (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-black/40 border border-[var(--card-border)] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <AvatarUpload
                    profileId={f.id}
                    name={f.display_name}
                    avatarUrl={f.avatar_url}
                    size={44}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">
                      {f.display_name}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-muted">
                      {highest > 0 ? formatPlate(highest) : "—"}
                    </span>
                  </div>
                </div>
                <form action={deleteFakeProfile}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-red-400 transition-colors shrink-0"
                  >
                    Ta bort
                  </button>
                </form>
              </li>
            );
          })}
          {(fakes ?? []).length === 0 && (
            <li className="text-sm text-muted text-center py-6">
              Du hanterar inga andra spelare än.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
