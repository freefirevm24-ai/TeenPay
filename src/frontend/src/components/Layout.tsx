import { Avatar } from "@/components/Avatar";
import { SignInButton } from "@/components/InternetIdentity";
import { Money } from "@/components/Money";
import { useIncomingAlerts } from "@/hooks/useIncomingAlerts";
import { useBalance, useCallerProfile } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, QrCode, Trophy, User, Users } from "lucide-react";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Wallet", icon: Home },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/scan", label: "Scan", icon: QrCode },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/profile", label: "You", icon: User },
] as const;

function Header() {
  const { data: profile } = useCallerProfile();
  const { data: balance } = useBalance();

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          data-ocid="nav.home_link"
          className="flex items-center gap-2 rounded-full px-1 py-1 transition-pop hover:opacity-90"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary font-display text-lg font-black text-primary-foreground shadow-pop">
            ₹
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Neon Vault
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            data-ocid="header.balance_chip"
            className="glass-strong hidden items-center gap-1.5 rounded-full px-3 py-1.5 sm:flex"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Bal
            </span>
            <Money amount={balance ?? 0n} size="sm" tone="incoming" />
          </span>
          <Link
            to="/profile"
            data-ocid="nav.profile_link"
            aria-label="Open profile"
            className="rounded-full transition-pop hover:scale-105"
          >
            <Avatar name={profile?.fullName ?? "You"} seed="me" size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      data-ocid="nav.bottom_bar"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3"
    >
      <div className="glass-strong mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full p-1.5 shadow-glass">
        {NAV_ITEMS.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.${item.label.toLowerCase()}_link`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-semibold uppercase tracking-wider transition-pop",
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-pop"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-border/60 px-4 py-6 text-center">
      <p className="text-xs text-muted-foreground">
        Virtual money only — no real payments, just vibes. 🤑
      </p>
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
          typeof window !== "undefined" ? window.location.hostname : "",
        )}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        © {new Date().getFullYear()}. Built with love using caffeine.ai
      </a>
    </footer>
  );
}

/** Ambient blurred orbs behind the glass panels. */
function AmbientOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="orb -left-24 top-10 h-72 w-72 bg-primary/40 animate-float-slow" />
      <div className="orb -right-20 top-1/3 h-80 w-80 bg-accent/30 animate-float-slow" />
      <div className="orb bottom-0 left-1/3 h-72 w-72 bg-chart-4/30 animate-float-slow" />
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  useIncomingAlerts();
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <AmbientOrbs />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5">
        {children}
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}

/** Compact page heading used across inner pages. */
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Shared glass panel surface. */
export function GlassPanel({
  children,
  className,
  featured = false,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <section
      className={cn(
        "glass rounded-3xl p-5 shadow-glass",
        featured && "ring-1 ring-primary/40",
        className,
      )}
    >
      {children}
    </section>
  );
}
