/** Formatting helpers. Money is always RWF and always tabular. */

export function formatMoney(amount: number | null | undefined, currency = "RWF") {
  const value = amount ?? 0;
  return `${value.toLocaleString("en-RW", { maximumFractionDigits: 0 })} ${currency}`;
}

/** Compact form for stat tiles: 1.2M, 340K. */
export function formatCompact(amount: number | null | undefined) {
  const value = amount ?? 0;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return `${value}`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 days ago" — used in notification and audit feeds. */
export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function fundingPercent(funded: number | null | undefined, goal: number | null | undefined) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round(((funded ?? 0) / goal) * 100));
}

export function initialsOf(name: string | null | undefined) {
  if (!name) return "??";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
