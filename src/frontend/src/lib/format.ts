/** Formatting helpers for fake rupees and backend timestamps. */

/** Convert a Motoko nanosecond timestamp into a JS Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Human-friendly relative time for a backend timestamp. */
export function formatRelativeTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "just now";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Full date + time for transaction detail rows. */
export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Unknown time";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Indian-grouped rupee amount, e.g. 10000n -> "₹10,000". */
export function formatRupees(amount: bigint): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Compact rupee amount for tight chips, e.g. 125000n -> "₹1.25L". */
export function formatRupeesCompact(amount: bigint): string {
  const value = Number(amount);
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return formatRupees(amount);
}

/** Parse a user-typed rupee string into a bigint, or null when invalid. */
export function parseRupees(input: string): bigint | null {
  const cleaned = input.replace(/[^0-9]/g, "");
  if (cleaned.length === 0) return null;
  try {
    const value = BigInt(cleaned);
    return value > 0n ? value : null;
  } catch {
    return null;
  }
}

/** Two-letter initials for avatar fallbacks. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Normalize an Instagram handle to always carry a leading '@'. */
export function normalizeInstagram(handle: string): string {
  const trimmed = handle.trim().replace(/^@+/, "");
  return trimmed.length > 0 ? `@${trimmed}` : "";
}
