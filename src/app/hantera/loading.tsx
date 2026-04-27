export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 max-w-2xl w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-2 animate-pulse">
        <div className="h-9 w-24 bg-[var(--card)] rounded-full" />
        <div className="h-7 w-24 bg-[var(--card)] rounded" />
        <div className="h-9 w-20 bg-[var(--card)] rounded-full" />
      </header>
      <div className="rounded-3xl bg-[var(--card)] h-32 animate-pulse" />
      <div className="rounded-3xl bg-[var(--card)] h-40 animate-pulse" />
      <div className="rounded-3xl bg-[var(--card)] h-64 animate-pulse" />
    </main>
  );
}
