import { Avatar } from "@/components/Avatar";
import { GlassPanel, PageHeading } from "@/components/Layout";
import { Money } from "@/components/Money";
import { useCallerProfile, useLeaderboard } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Crown, Medal, Trophy } from "lucide-react";

const PODIUM_STYLES = [
  "from-warning to-chart-3 text-background",
  "from-accent to-chart-2 text-background",
  "from-chart-5 to-primary text-background",
];

export function LeaderboardPage() {
  const { data: entries, isLoading } = useLeaderboard();
  const { data: profile } = useCallerProfile();

  const myName = profile?.fullName;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Leaderboard"
        subtitle="Who's the richest in fake rupees?"
      />

      {isLoading ? (
        <div data-ocid="leaderboard.loading_state" className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => `rank-skeleton-${i}`).map(
            (id) => (
              <div
                key={id}
                className="h-16 animate-pulse rounded-2xl border border-border bg-card/40"
              />
            ),
          )}
        </div>
      ) : !entries || entries.length === 0 ? (
        <GlassPanel
          data-ocid="leaderboard.empty_state"
          className="flex flex-col items-center gap-3 py-10 text-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-2xl">
            🏆
          </span>
          <p className="font-display text-lg font-bold">No rankings yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Once people join the vault, the rich list shows up here.
          </p>
        </GlassPanel>
      ) : (
        <>
          <div className="grid grid-cols-3 items-end gap-2">
            {[1, 0, 2].map((slot) => {
              const entry = entries[slot];
              if (!entry) return <div key={`podium-empty-${slot}`} />;
              const isFirst = slot === 0;
              return (
                <div
                  key={entry.userId.toText()}
                  data-ocid={`leaderboard.podium.${slot + 1}`}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-b p-3 text-center shadow-glass",
                    PODIUM_STYLES[slot],
                    isFirst ? "pb-6 pt-5" : "pb-4 pt-4",
                  )}
                >
                  {isFirst ? (
                    <Crown className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Medal className="h-5 w-5" aria-hidden="true" />
                  )}
                  <Avatar
                    name={entry.fullName}
                    seed={entry.userId.toText()}
                    size={isFirst ? "lg" : "md"}
                  />
                  <p className="w-full truncate text-xs font-bold">
                    {entry.fullName}
                  </p>
                  <p className="font-mono text-xs font-bold">
                    ₹{entry.balance.toLocaleString("en-IN")}
                  </p>
                </div>
              );
            })}
          </div>

          <ul data-ocid="leaderboard.list" className="space-y-2">
            {entries.map((entry, index) => {
              const isMe = entry.fullName === myName;
              return (
                <li
                  key={entry.userId.toText()}
                  data-ocid={`leaderboard.item.${index + 1}`}
                  className={cn(
                    "glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-glass",
                    isMe && "ring-1 ring-primary/60",
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted font-display text-sm font-bold">
                    {entry.rank.toString()}
                  </span>
                  <Avatar
                    name={entry.fullName}
                    seed={entry.userId.toText()}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {entry.fullName}
                      {isMe && (
                        <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.instagramId}
                    </p>
                  </div>
                  <Money amount={entry.balance} size="sm" tone="incoming" />
                </li>
              );
            })}
          </ul>
        </>
      )}

      <GlassPanel className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/20 text-warning">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          Rankings update live as fake rupees move around the vault.
        </p>
      </GlassPanel>
    </div>
  );
}
