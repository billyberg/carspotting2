import { signOut } from "./actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm rounded-full border border-[var(--card-border)] px-4 py-2 hover:border-white/40 transition-colors"
      >
        Logga ut
      </button>
    </form>
  );
}
