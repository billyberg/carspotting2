"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-3xl bg-[var(--card)] border border-[var(--card-border)] p-6 text-center space-y-4">
        <h2 className="text-lg font-medium">Något gick fel</h2>
        <p className="text-sm text-muted break-words">{error.message}</p>
        <button
          onClick={reset}
          className="w-full rounded-2xl bg-white text-black font-medium px-5 py-3 hover:opacity-90"
        >
          Försök igen
        </button>
      </div>
    </main>
  );
}
