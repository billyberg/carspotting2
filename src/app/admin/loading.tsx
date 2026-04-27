export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-4xl w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-2 animate-pulse">
        <div className="h-9 w-24 bg-[var(--card)] rounded-full" />
        <div className="h-7 w-16 bg-[var(--card)] rounded" />
        <div className="w-24" />
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[var(--card)] h-20 animate-pulse"
          />
        ))}
      </div>
      <div className="rounded-3xl bg-[var(--card)] h-96 animate-pulse" />
    </main>
  );
}
