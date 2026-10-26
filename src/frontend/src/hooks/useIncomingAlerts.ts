import { Direction } from "@/backend";
import { useTransactions } from "@/hooks/useQueries";
import { burstConfetti } from "@/lib/confetti";
import { formatRupees } from "@/lib/format";
import { fireSoundbox } from "@/lib/soundbox";
import { useSoundbox } from "@/lib/soundbox-context";
import { useEffect, useRef } from "react";

const LARGE_TRANSFER = 5000n;

/**
 * Watches the transaction feed and fires the soundbox + confetti when a new
 * incoming transfer appears while the app is open.
 */
export function useIncomingAlerts(): void {
  const { data: transactions } = useTransactions();
  const { enabled, volume } = useSoundbox();
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!transactions) return;

    if (!initialized.current) {
      for (const tx of transactions) seenIds.current.add(tx.id.toString());
      initialized.current = true;
      return;
    }

    for (const tx of transactions) {
      const id = tx.id.toString();
      if (seenIds.current.has(id)) continue;
      seenIds.current.add(id);
      if (tx.direction !== Direction.received) continue;

      fireSoundbox(
        `Received ${formatRupees(tx.amount)} fake rupees from ${tx.counterpartyName}. Party kab dega?`,
        volume,
        enabled,
      );
      if (tx.amount >= LARGE_TRANSFER) burstConfetti();
    }
  }, [transactions, enabled, volume]);
}
