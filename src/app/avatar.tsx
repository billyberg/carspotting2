export function Avatar({
  url,
  name,
  size = 40,
  className = "",
}: {
  url: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={style}
        className={`rounded-full object-cover bg-[var(--card)] ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...style, fontSize: size * 0.4 }}
      className={`rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center text-muted font-medium ${className}`}
    >
      {initial}
    </div>
  );
}
