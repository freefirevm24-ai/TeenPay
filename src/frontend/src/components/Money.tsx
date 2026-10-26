import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

interface MoneyProps {
  amount: bigint;
  size?: "sm" | "md" | "lg" | "hero";
  tone?: "default" | "incoming" | "outgoing";
  showSign?: boolean;
  className?: string;
}

const SIZES = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
  hero: "text-5xl md:text-7xl",
};

const TONES = {
  default: "text-foreground",
  incoming: "text-accent",
  outgoing: "text-primary",
};

/** Arcade-scoreboard money figure with Indian grouping. */
export function Money({
  amount,
  size = "md",
  tone = "default",
  showSign = false,
  className,
}: MoneyProps) {
  const sign = showSign
    ? tone === "incoming"
      ? "+"
      : tone === "outgoing"
        ? "−"
        : ""
    : "";
  return (
    <span
      className={cn(
        "font-display font-bold tabular-nums tracking-tight",
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      {sign}
      {formatRupees(amount)}
    </span>
  );
}

/** Glowing hero balance with a spinning coin glyph. */
export function BalanceDisplay({
  amount,
  className,
}: {
  amount: bigint;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-cash text-background shadow-pop">
        <Coins className="h-6 w-6 animate-coin-spin" aria-hidden="true" />
      </span>
      <Money amount={amount} size="hero" className="text-gradient-cash" />
    </div>
  );
}
