import { AddFriendError, RequestStatus } from "@/backend";
import { Avatar } from "@/components/Avatar";
import { GlassPanel, PageHeading } from "@/components/Layout";
import { Money } from "@/components/Money";
import { QrCanvas } from "@/components/QrCanvas";
import { SendMoneyDialog, type SendTarget } from "@/components/SendMoneyDialog";
import {
  useAcceptRequest,
  useAddFriend,
  useDeclineRequest,
  useFriends,
  useIncomingRequests,
  useMyQrPayload,
  useOutgoingRequests,
  useRemoveFriend,
  useSearchFriend,
} from "@/hooks/useQueries";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Check, QrCode, Search, Send, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";

export function FriendsPage() {
  const { data: friends, isLoading } = useFriends();
  const { data: incoming } = useIncomingRequests();
  const { data: outgoing } = useOutgoingRequests();
  const { data: qrPayload } = useMyQrPayload();

  const searchFriend = useSearchFriend();
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();
  const acceptRequest = useAcceptRequest();
  const declineRequest = useDeclineRequest();

  const [query, setQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<SendTarget | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);

  function handleSearch() {
    const trimmed = query.trim().replace(/^@+/, "");
    if (!trimmed) return;
    setSearchMessage(null);
    searchFriend.mutate(trimmed, {
      onSuccess: (result) => {
        if (!result) {
          setSearchMessage(`No user found for "@${trimmed}".`);
          return;
        }
        addFriend.mutate(result.userId, {
          onSuccess: (res) => {
            if (res.__kind__ === "err") {
              setSearchMessage(addFriendMessage(res.err, result.fullName));
              return;
            }
            setSearchMessage(`Added ${result.fullName} to your crew! 🎉`);
            setQuery("");
          },
          onError: () => setSearchMessage("Could not add that friend."),
        });
      },
      onError: () => setSearchMessage("Search failed. Try again."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Friends"
        subtitle="Your fake-money crew."
        action={
          <button
            type="button"
            data-ocid="friends.show_qr_button"
            onClick={() => setShowQr((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-pop hover:border-accent/60 hover:text-foreground"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            My QR
          </button>
        }
      />

      {showQr && (
        <GlassPanel className="flex flex-col items-center gap-3 animate-pop-in">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Scan to add me
          </p>
          <div className="rounded-2xl bg-white p-3 shadow-glass">
            {qrPayload ? (
              <QrCanvas value={qrPayload} size={200} />
            ) : (
              <div className="h-[200px] w-[200px] animate-pulse rounded-xl bg-muted" />
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Friends scan this to add you instantly.
          </p>
        </GlassPanel>
      )}

      <GlassPanel className="animate-fade-up">
        <label
          htmlFor="friendSearch"
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add by username
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="friendSearch"
              data-ocid="friends.search_input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="@instagramhandle"
              className="w-full rounded-2xl border border-input bg-background/60 py-3 pl-9 pr-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="button"
            data-ocid="friends.add_button"
            onClick={handleSearch}
            disabled={
              !query.trim() || searchFriend.isPending || addFriend.isPending
            }
            className="rounded-2xl bg-gradient-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searchFriend.isPending || addFriend.isPending ? "…" : "Add"}
          </button>
        </div>
        {searchMessage && (
          <p
            data-ocid="friends.search_message"
            className="mt-2 rounded-2xl border border-border bg-background/40 px-3 py-2 text-sm text-muted-foreground"
          >
            {searchMessage}
          </p>
        )}
        <Link
          to="/scan"
          data-ocid="friends.scan_link"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/50 px-4 py-3 text-sm font-semibold text-accent transition-pop hover:bg-accent/10"
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          Or scan a friend's QR code
        </Link>
      </GlassPanel>

      {incoming && incoming.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
            Money Requests
          </h2>
          <ul data-ocid="friends.requests_list" className="space-y-2">
            {incoming.map((req, index) => (
              <li
                key={req.id.toString()}
                data-ocid={`friends.request_item.${index + 1}`}
                className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-glass"
              >
                <Avatar
                  name={req.fromName}
                  seed={req.fromUser.toText()}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {req.fromName} wants money
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {req.note} · {formatRelativeTime(req.createdAt)}
                  </p>
                </div>
                <Money amount={req.amount} size="sm" tone="outgoing" />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    data-ocid={`friends.accept_button.${index + 1}`}
                    aria-label={`Accept request from ${req.fromName}`}
                    onClick={() => acceptRequest.mutate(req.id)}
                    disabled={acceptRequest.isPending}
                    className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-accent transition-pop hover:bg-accent/30 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    data-ocid={`friends.decline_button.${index + 1}`}
                    aria-label={`Decline request from ${req.fromName}`}
                    onClick={() => declineRequest.mutate(req.id)}
                    disabled={declineRequest.isPending}
                    className="grid h-9 w-9 place-items-center rounded-full bg-destructive/20 text-destructive transition-pop hover:bg-destructive/30 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="animate-fade-up">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
          Your Crew
        </h2>
        {isLoading ? (
          <div data-ocid="friends.loading_state" className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => `friend-skeleton-${i}`).map(
              (id) => (
                <div
                  key={id}
                  className="h-16 animate-pulse rounded-2xl border border-border bg-card/40"
                />
              ),
            )}
          </div>
        ) : !friends || friends.length === 0 ? (
          <GlassPanel
            data-ocid="friends.empty_state"
            className="flex flex-col items-center gap-3 py-10 text-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-2xl">
              🫂
            </span>
            <p className="font-display text-lg font-bold">No friends yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add someone by username or scan their QR to start the fake-money
              chaos.
            </p>
          </GlassPanel>
        ) : (
          <ul data-ocid="friends.list" className="space-y-2">
            {friends.map((friend, index) => (
              <li
                key={friend.userId.toText()}
                data-ocid={`friends.item.${index + 1}`}
                className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-glass"
              >
                <Avatar name={friend.fullName} seed={friend.userId.toText()} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{friend.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {friend.instagramId}
                  </p>
                </div>
                <Money amount={friend.balance} size="sm" tone="incoming" />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    data-ocid={`friends.send_button.${index + 1}`}
                    aria-label={`Send money to ${friend.fullName}`}
                    onClick={() => {
                      setSendTarget({
                        userId: friend.userId,
                        fullName: friend.fullName,
                        instagramId: friend.instagramId,
                      });
                      setSendOpen(true);
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary transition-pop hover:bg-primary/30"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    data-ocid={`friends.remove_button.${index + 1}`}
                    aria-label={`Remove ${friend.fullName}`}
                    onClick={() => removeFriend.mutate(friend.userId)}
                    disabled={removeFriend.isPending}
                    className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground transition-pop hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing && outgoing.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
            Requests You Sent
          </h2>
          <ul data-ocid="friends.outgoing_list" className="space-y-2">
            {outgoing.map((req, index) => (
              <li
                key={req.id.toString()}
                data-ocid={`friends.outgoing_item.${index + 1}`}
                className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-glass"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    Requested from {req.fromName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {req.note} · {formatRelativeTime(req.createdAt)}
                  </p>
                </div>
                <Money amount={req.amount} size="sm" />
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    req.status === RequestStatus.pending &&
                      "bg-warning/20 text-warning",
                    req.status === RequestStatus.accepted &&
                      "bg-accent/20 text-accent",
                    req.status === RequestStatus.declined &&
                      "bg-destructive/20 text-destructive",
                  )}
                >
                  {req.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
      return "You can't add yourself, silly. 😜";
    case AddFriendError.notFound:
      return "That user could not be found.";
    default:
      return "Could not add that friend.";
  }
}
