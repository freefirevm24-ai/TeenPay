import type { Friend } from "@/backend";
import { Avatar } from "@/components/Avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRequestMoney } from "@/hooks/useQueries";
import { parseRupees } from "@/lib/format";
import { useEffect, useState } from "react";

interface RequestMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
}

export function RequestMoneyDialog({
  open,
  onOpenChange,
  friends,
}: RequestMoneyDialogProps) {
  const requestMoney = useRequestMoney();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setFriend(null);
      setAmount("");
      setNote("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const parsedAmount = parseRupees(amount);
  const canSubmit =
    !!friend && parsedAmount !== null && !requestMoney.isPending;

  function handleSubmit() {
    if (!friend || parsedAmount === null) return;
    setError(null);
    requestMoney.mutate(
      {
        fromUser: friend.userId,
        amount: parsedAmount,
        note: note.trim() || "Paisa do yaar 🙏",
      },
      {
        onSuccess: () => setSuccess(true),
        onError: () => setError("Could not send the request. Try again."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="request.dialog"
        className="glass-strong max-w-md rounded-3xl border-border/60"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">
            Request Virtual Money
          </DialogTitle>
          <DialogDescription>
            Ask a friend for fake rupees. They can accept or decline.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div
            data-ocid="request.success_state"
            className="space-y-4 py-4 text-center"
          >
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-cash text-2xl">
              📨
            </span>
            <p className="font-display text-lg font-bold">Request sent!</p>
            <p className="text-sm text-muted-foreground">
              {friend?.fullName} will see it in their notifications.
            </p>
            <button
              type="button"
              data-ocid="request.close_button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-full bg-gradient-primary px-6 py-3 font-display font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                From
              </p>
              {friends.length === 0 ? (
                <p className="rounded-2xl border border-border px-3 py-3 text-sm text-muted-foreground">
                  Add a friend first to request money.
                </p>
              ) : (
                <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {friends.map((f) => (
                    <button
                      key={f.userId.toText()}
                      type="button"
                      data-ocid={`request.friend_option.${f.userId.toText().slice(0, 8)}`}
                      onClick={() => setFriend(f)}
                      className={
                        friend?.userId.toText() === f.userId.toText()
                          ? "flex w-full items-center gap-3 rounded-2xl border border-primary bg-primary/15 px-3 py-2 text-left"
                          : "flex w-full items-center gap-3 rounded-2xl border border-border px-3 py-2 text-left transition-pop hover:border-primary/60 hover:bg-primary/10"
                      }
                    >
                      <Avatar
                        name={f.fullName}
                        seed={f.userId.toText()}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {f.fullName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="requestAmount"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-accent">
                  ₹
                </span>
                <input
                  id="requestAmount"
                  data-ocid="request.amount_input"
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="200"
                  className="w-full rounded-2xl border border-input bg-background/60 py-3 pl-9 pr-3 font-mono text-lg outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="requestNote"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Reason (optional)
              </label>
              <input
                id="requestNote"
                data-ocid="request.note_input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Paisa do yaar 🙏"
                maxLength={80}
                className="w-full rounded-2xl border border-input bg-background/60 px-3.5 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {error && (
              <p
                role="alert"
                data-ocid="request.error_state"
                className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              data-ocid="request.submit_button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requestMoney.isPending ? "Sending…" : "Send request 📨"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
