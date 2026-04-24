import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOwnProfile } from "@/app/actions";

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
