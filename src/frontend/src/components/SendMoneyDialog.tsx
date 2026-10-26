import type { Friend, UserId } from "@/backend";
import { Avatar } from "@/components/Avatar";
import { Money } from "@/components/Money";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSendMoney } from "@/hooks/useQueries";
import { burstConfetti } from "@/lib/confetti";
import { formatRupees, parseRupees } from "@/lib/format";
import { fireSoundbox } from "@/lib/soundbox";
import { useSoundbox } from "@/lib/soundbox-context";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const FUN_NOTES = [
  "For samosa party 🥟",
  "Bhaichara on top 🤝",
  "Chai + bun maska ☕",
  "Birthday treat 🎂",
  "Recharge kar le 📱",
  "Kanjoos tax 💸",
  "Movie night 🍿",
  "Exam pass bribe 📚",
];

const LARGE_TRANSFER = 5000n;

export interface SendTarget {
  userId: UserId;
  fullName: string;
  instagramId: string;
}

interface SendMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: SendTarget | null;
  friends: Friend[];
  onSent?: () => void;
}

export function SendMoneyDialog({
  open,
  onOpenChange,
  target,
  friends,
  onSent,
}: SendMoneyDialogProps) {
  const sendMoney = useSendMoney();
  const { enabled, volume } = useSoundbox();

  const [recipient, setRecipient] = useState<SendTarget | null>(target);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRecipient(target);
      setAmount("");
      setNote("");
      setError(null);
    }
  }, [open, target]);

  const parsedAmount = parseRupees(amount);
  const canSubmit =
    !!recipient && parsedAmount !== null && !sendMoney.isPending;

  function handleSubmit() {
    if (!recipient || parsedAmount === null) return;
    setError(null);
    const capturedAmount = parsedAmount;
    const capturedNote = note.trim() || "Just because 💫";
    const capturedRecipient = recipient;

    sendMoney.mutate(
      {
        recipient: capturedRecipient.userId,
        amount: capturedAmount,
        note: capturedNote,
      },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "err") {
            setError(transferErrorMessage(result.err));
            return;
          }
          if (capturedAmount >= LARGE_TRANSFER) {
            burstConfetti();
          }
          fireSoundbox(
            `Sent ${formatRupees(capturedAmount)} to ${capturedRecipient.fullName}. Bhaichara on top!`,
            volume,
            enabled,
          );
          onOpenChange(false);
          onSent?.();
        },
        onError: () => setError("Transfer failed. Try again in a sec."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="send.dialog"
        className="glass-strong max-w-md rounded-3xl border-border/60"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">
            Send Virtual Money
          </DialogTitle>
          <DialogDescription>
            Fake rupees, real friendship. Pick a friend and a fun note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              To
            </p>
            {recipient ? (
              <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2.5">
                <Avatar
                  name={recipient.fullName}
                  seed={recipient.userId.toText()}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{recipient.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {recipient.instagramId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {friends.length === 0 ? (
                  <p className="rounded-2xl border border-border px-3 py-3 text-sm text-muted-foreground">
                    No friends yet — add one from the Friends tab first.
                  </p>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.userId.toText()}
                      type="button"
                      data-ocid={`send.friend_option.${friend.userId.toText().slice(0, 8)}`}
                      onClick={() =>
                        setRecipient({
                          userId: friend.userId,
                          fullName: friend.fullName,
                          instagramId: friend.instagramId,
                        })
                      }
                      className="flex w-full items-center gap-3 rounded-2xl border border-border px-3 py-2 text-left transition-pop hover:border-primary/60 hover:bg-primary/10"
                    >
                      <Avatar
                        name={friend.fullName}
                        seed={friend.userId.toText()}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {friend.fullName}
                      </span>
                      <Money
                        amount={friend.balance}
                        size="sm"
                        tone="incoming"
                      />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="sendAmount"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-accent">
                ₹
              </span>
              <input
                id="sendAmount"
                data-ocid="send.amount_input"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="500"
                className="w-full rounded-2xl border border-input bg-background/60 py-3 pl-9 pr-3 font-mono text-lg outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sendNote"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Fun note
            </label>
            <input
              id="sendNote"
              data-ocid="send.note_input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="For samosa party 🥟"
              maxLength={80}
              className="w-full rounded-2xl border border-input bg-background/60 px-3.5 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FUN_NOTES.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  data-ocid={`send.note_suggestion.${suggestion.slice(0, 6).replace(/\s/g, "_")}`}
                  onClick={() => setNote(suggestion)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-pop hover:border-accent/60 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              data-ocid="send.error_state"
              className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            data-ocid="send.submit_button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {sendMoney.isPending ? "Sending…" : "Send it 🚀"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function transferErrorMessage(err: {
  __kind__: string;
  insufficientBalance?: { balance: bigint };
}): string {
  switch (err.__kind__) {
    case "insufficientBalance":
      return `Not enough fake rupees. You only have ${formatRupees(
        err.insufficientBalance?.balance ?? 0n,
      )}.`;
    case "cannotSendToSelf":
      return "You can't send money to yourself, genius. 😅";
    case "recipientNotFound":
      return "That friend could not be found.";
    case "invalidAmount":
      return "Enter an amount greater than zero.";
    default:
      return "Transfer failed. Try again.";
  }
}
