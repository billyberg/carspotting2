export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-2xl w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-2 animate-pulse">
        <div className="h-7 w-32 bg-[var(--card)] rounded" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-[var(--card)] rounded-full" />
          <div className="h-9 w-9 bg-[var(--card)] rounded-full" />
        </div>
      </header>
      <div className="rounded-3xl bg-[var(--card)] h-44 animate-pulse" />
      <div className="rounded-3xl bg-[var(--card)] h-64 animate-pulse" />
    </main>
  );
}
