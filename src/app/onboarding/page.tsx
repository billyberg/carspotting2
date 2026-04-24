import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { claimImport, createOwnProfile } from "@/app/actions";
import { formatPlate } from "@/lib/plate";
import type { PendingImport } from "@/lib/types";
import { Avatar } from "@/app/avatar";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile) redirect("/");

  const { data: pending } = await supabase
    .from("pending_imports")
    .select("email, display_name, bootstrap_plate, avatar_url")
    .maybeSingle<PendingImport>();

  if (pending) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Välkommen tillbaka!
            </h1>
            <p className="text-sm text-muted">
              Vi hittade dig i listan från gamla appen.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-6 flex flex-col items-center gap-3">
            <Avatar
              url={pending.avatar_url}
              name={pending.display_name}
              size={80}
            />
            <div className="text-xl font-semibold">{pending.display_name}</div>
            <div className="text-xs uppercase tracking-widest text-muted pt-2">
              Senaste nummer
            </div>
            <div className="font-mono tabular-nums text-3xl">
              {formatPlate(pending.bootstrap_plate)}
            </div>
          </div>
          <form action={claimImport}>
            <button
              type="submit"
              className="w-full rounded-2xl bg-white text-black font-medium px-5 py-4 hover:opacity-90 transition-opacity"
            >
              Fortsätt jaga
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Välkommen till Carspotting
          </h1>
          <p className="text-sm text-muted">Vad ska du heta på topplistan?</p>
        </div>
        <form action={createOwnProfile} className="space-y-3">
          <input
            type="text"
            name="display_name"
            required
            autoFocus
            maxLength={40}
            placeholder="Ditt namn"
            className="w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] px-5 py-4 text-base placeholder:text-muted focus:outline-none focus:border-white/40"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-white text-black font-medium px-5 py-4 hover:opacity-90 transition-opacity"
          >
            Börja jaga
          </button>
        </form>
      </div>
    </main>
  );
}
