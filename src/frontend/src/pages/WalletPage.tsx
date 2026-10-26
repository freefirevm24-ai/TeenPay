import { Direction } from "@/backend";
import { Avatar } from "@/components/Avatar";
import { GlassPanel, PageHeading } from "@/components/Layout";
import { BalanceDisplay, Money } from "@/components/Money";
import { RequestMoneyDialog } from "@/components/RequestMoneyDialog";
import { SendMoneyDialog } from "@/components/SendMoneyDialog";
import {
  useFriends,
  useIncomingRequests,
  useMyCard,
  useTransactions,
  useWalletSummary,
} from "@/hooks/useQueries";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  HandCoins,
  Inbox,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export function WalletPage() {
  const { data: summary } = useWalletSummary();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: friends } = useFriends();
  const { data: card } = useMyCard();
  const { data: incoming } = useIncomingRequests();

  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const pendingCount = incoming?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Your Vault"
        subtitle="Fake rupees, real chaos."
        action={
          <Link
            to="/card"
            data-ocid="wallet.card_link"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-pop hover:border-primary/60 hover:text-foreground"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Card
          </Link>
        }
      />

      <GlassPanel featured className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Balance
        </p>
        <BalanceDisplay amount={summary?.balance ?? 0n} className="mt-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          {summary?.transactionCount ?? 0n} transactions and counting
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            data-ocid="wallet.send_button"
            onClick={() => setSendOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3.5 font-display font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.03] active:scale-95"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Send
          </button>
          <button
            type="button"
            data-ocid="wallet.request_button"
            onClick={() => setRequestOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-cash px-5 py-3.5 font-display font-bold text-background shadow-pop transition-pop hover:scale-[1.03] active:scale-95"
          >
            <HandCoins className="h-4 w-4" aria-hidden="true" />
            Request
          </button>
        </div>
      </GlassPanel>

      {pendingCount > 0 && (
        <Link
          to="/friends"
          data-ocid="wallet.requests_banner"
          className="flex items-center gap-3 rounded-3xl border border-warning/50 bg-warning/10 px-4 py-3 transition-pop hover:bg-warning/20"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-warning/20 text-warning">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {pendingCount} money request{pendingCount > 1 ? "s" : ""} waiting
            </p>
            <p className="text-xs text-muted-foreground">
              Tap to accept or decline
            </p>
          </div>
        </Link>
      )}

      {card && (
        <div className="animate-fade-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your Card
          </p>
          <Link to="/card" data-ocid="wallet.saved_card" className="block">
            <div
              className="relative overflow-hidden rounded-3xl p-5 shadow-glass ring-1 ring-white/15 transition-pop hover:scale-[1.01]"
              style={{ background: card.background }}
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-xl font-extrabold text-white drop-shadow">
                  {card.title}
                </span>
                <span className="text-2xl">{card.logo}</span>
              </div>
              <p className="mt-8 font-mono text-lg tracking-[0.25em] text-white/90">
                •••• •••• •••• 4200
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  Neon Vault
                </span>
                <span className="flex gap-1">
                  {card.stickers.slice(0, 4).map((sticker) => (
                    <span key={sticker} className="text-lg">
                      {sticker}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <section className="animate-fade-up">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Transactions
          </h2>
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>

        {txLoading ? (
          <div data-ocid="wallet.transactions_loading" className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => `tx-skeleton-${i}`).map(
              (id) => (
                <div
                  key={id}
                  className="h-16 animate-pulse rounded-2xl border border-border bg-card/40"
                />
              ),
            )}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <GlassPanel
            data-ocid="wallet.transactions_empty_state"
            className="flex flex-col items-center gap-3 py-10 text-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-2xl">
              🪙
            </span>
            <p className="font-display text-lg font-bold">
              No transactions yet
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Send your first fake rupees and watch the soundbox go brrr.
            </p>
            <button
              type="button"
              data-ocid="wallet.empty_send_button"
              onClick={() => setSendOpen(true)}
              className="mt-1 rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-pop transition-pop hover:scale-105 active:scale-95"
            >
              Send money
            </button>
          </GlassPanel>
        ) : (
          <ul data-ocid="wallet.transactions_list" className="space-y-2">
            {transactions.map((tx, index) => {
              const incomingTx = tx.direction === Direction.received;
              return (
                <li
                  key={tx.id.toString()}
                  data-ocid={`wallet.transaction_item.${index + 1}`}
                  className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-glass"
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                      incomingTx
                        ? "bg-accent/20 text-accent"
                        : "bg-primary/20 text-primary",
                    )}
                  >
                    {incomingTx ? (
                      <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {tx.counterpartyName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tx.note} · {formatRelativeTime(tx.timestamp)}
                    </p>
                  </div>
                  <Money
                    amount={tx.amount}
                    size="sm"
                    tone={incomingTx ? "incoming" : "outgoing"}
                    showSign
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SendMoneyDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        target={null}
        friends={friends ?? []}
      />
      <RequestMoneyDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        friends={friends ?? []}
      />
    </div>
  );
}
