import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-primary to-chart-4",
  "from-accent to-chart-3",
  "from-chart-5 to-primary",
  "from-chart-3 to-accent",
];

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

interface AvatarProps {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

/** Deterministic gradient avatar with initials — no external images needed. */
export function Avatar({ name, seed, size = "md", className }: AvatarProps) {
  const gradient = gradientFor(seed ?? name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display font-bold text-background ring-1 ring-white/15",
        gradient,
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
