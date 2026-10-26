import { AddFriendError, type FriendSearchResult } from "@/backend";
import { Avatar } from "@/components/Avatar";
import { GlassPanel, PageHeading } from "@/components/Layout";
import { QrScanner } from "@/components/QrScanner";
import { SendMoneyDialog, type SendTarget } from "@/components/SendMoneyDialog";
import {
  useAddFriend,
  useFriends,
  useResolveFriendQr,
} from "@/hooks/useQueries";
import { Check, UserPlus } from "lucide-react";
import { useCallback, useState } from "react";

export function ScanPage() {
  const resolveQr = useResolveFriendQr();
  const addFriend = useAddFriend();
  const { data: friends } = useFriends();

  const [scanned, setScanned] = useState<FriendSearchResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<SendTarget | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const handleScan = useCallback(
    (payload: string) => {
      if (resolveQr.isPending) return;
      setMessage(null);
      resolveQr.mutate(payload, {
        onSuccess: (result) => {
          if (!result) {
            setMessage("That QR code isn't a Neon Vault friend code.");
            return;
          }
          setScanned(result);
          setSendTarget({
            userId: result.userId,
            fullName: result.fullName,
            instagramId: result.instagramId,
          });
          setSendOpen(true);
        },
        onError: () => setMessage("Could not read that QR code."),
      });
    },
    [resolveQr],
  );

  function handleAdd() {
    if (!scanned) return;
    addFriend.mutate(scanned.userId, {
      onSuccess: (res) => {
        if (res.__kind__ === "err") {
          setMessage(addFriendMessage(res.err, scanned.fullName));
          return;
        }
        setMessage(`${scanned.fullName} added to your crew! 🎉`);
      },
      onError: () => setMessage("Could not add that friend."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Scan & Pay"
        subtitle="Point at a friend's QR to send fake rupees."
      />

      <GlassPanel className="animate-fade-up">
        <QrScanner onScan={handleScan} active />
      </GlassPanel>

      {message && (
        <p
          data-ocid="scan.message"
          className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
        >
          {message}
        </p>
      )}

      {scanned && (
        <GlassPanel
          data-ocid="scan.result_panel"
          className="flex items-center gap-3 animate-pop-in"
        >
          <Avatar name={scanned.fullName} seed={scanned.userId.toText()} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{scanned.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {scanned.instagramId}
            </p>
          </div>
          <button
            type="button"
            data-ocid="scan.add_friend_button"
            onClick={handleAdd}
            disabled={addFriend.isPending}
            className="flex items-center gap-1.5 rounded-full bg-gradient-cash px-4 py-2.5 font-display text-sm font-bold text-background shadow-pop transition-pop hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {addFriend.isPending ? (
              "…"
            ) : (
              <>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Add
              </>
            )}
          </button>
        </GlassPanel>
      )}

      <GlassPanel className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/20 text-accent">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          A successful scan instantly opens the Send Virtual Money popup,
          pre-filled with that friend. Add them to your crew too.
        </p>
      </GlassPanel>

      <SendMoneyDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        target={sendTarget}
        friends={friends ?? []}
      />
    </div>
  );
}

function addFriendMessage(err: AddFriendError, name: string): string {
  switch (err) {
    case AddFriendError.alreadyFriend:
      return `${name} is already in your crew.`;
    case AddFriendError.cannotAddSelf:
      return "That's your own QR code, genius. 😅";
    case AddFriendError.notFound:
      return "That user could not be found.";
    default:
      return "Could not add that friend.";
  }
}
