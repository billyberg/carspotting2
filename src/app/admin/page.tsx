import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPlate } from "@/lib/plate";
import { Avatar } from "@/app/avatar";

type AdminRow = {
  kind: "registered" | "fake" | "pending" | "pending-fake";
  profile_id: string | null;
  email: string | null;
  display_name: string;
  manager_display_name: string | null;
  is_admin: boolean;
  avatar_url: string | null;
  bootstrap_plate: number;
  highest_plate: number;
  total_finds: number;
  created_at: string;
};

const LABELS: Record<AdminRow["kind"], { text: string; color: string }> = {
  registered: { text: "Registrerad", color: "bg-emerald-500/20 text-emerald-300" },
  fake: { text: "Fake", color: "bg-blue-500/20 text-blue-300" },
  pending: { text: "Väntar", color: "bg-amber-500/20 text-amber-300" },
  "pending-fake": { text: "Väntar (fake)", color: "bg-purple-500/20 text-purple-300" },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownProfile?.is_admin) redirect("/");

  const { data: rows, error } = await supabase.rpc("admin_user_list");

  if (error) {
    return (
      <main className="min-h-screen p-6 max-w-4xl mx-auto">
        <p className="text-red-400">{error.message}</p>
      </main>
    );
  }

  const all = (rows ?? []) as AdminRow[];
  const counts = {
    registered: all.filter((r) => r.kind === "registered").length,
    fake: all.filter((r) => r.kind === "fake").length,
    pending: all.filter((r) => r.kind === "pending").length,
    "pending-fake": all.filter((r) => r.kind === "pending-fake").length,
  };

  return (
    <main className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-4xl w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-2">
        <Link
          href="/"
          className="text-sm rounded-full border border-[var(--card-border)] px-4 py-2 hover:border-white/40 transition-colors"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <div className="w-24" />
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(LABELS) as AdminRow["kind"][]).map((k) => (
          <div
            key={k}
            className="rounded-2xl bg-[var(--card)] border border-[var(--card-border)] p-4"
          >
            <div className="text-xs text-muted">{LABELS[k].text}</div>
            <div className="text-2xl font-semibold tabular-nums">{counts[k]}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-[var(--card)] border border-[var(--card-border)] overflow-hidden">
        <ul className="divide-y divide-[var(--card-border)]">
          {all.map((r, i) => (
            <li
              key={`${r.kind}-${r.profile_id ?? r.email ?? r.display_name}-${i}`}
              className="flex items-center gap-3 p-4"
            >
              <Avatar url={r.avatar_url} name={r.display_name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{r.display_name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${LABELS[r.kind].color}`}
                  >
                    {LABELS[r.kind].text}
                  </span>
                  {r.is_admin && (
                    <span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 bg-white text-black">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted truncate">
                  {r.email && <>{r.email}</>}
                  {r.manager_display_name && (
                    <>
                      {r.email ? " · " : ""}
                      Hanterad av {r.manager_display_name}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono tabular-nums text-lg">
                  {formatPlate(r.highest_plate)}
                </div>
                <div className="text-[10px] text-muted">
                  {r.total_finds > 0 ? `${r.total_finds} fynd` : "—"}
                </div>
              </div>
            </li>
          ))}
          {all.length === 0 && (
            <li className="text-sm text-muted text-center py-10">
              Inga användare.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
