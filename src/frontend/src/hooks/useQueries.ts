import { createActor } from "@/backend";
import type {
  AddFriendError,
  Card,
  CardInput,
  Friend,
  FriendSearchResult,
  LeaderboardEntry,
  MoneyRequest,
  Profile,
  ProfileInput,
  ProfileView,
  RequestError,
  Transaction,
  TransferError,
  UserId,
  WalletSummary,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const queryKeys = {
  profile: ["profile"] as const,
  balance: ["balance"] as const,
  walletSummary: ["walletSummary"] as const,
  transactions: ["transactions"] as const,
  friends: ["friends"] as const,
  incomingRequests: ["incomingRequests"] as const,
  outgoingRequests: ["outgoingRequests"] as const,
  card: ["card"] as const,
  leaderboard: ["leaderboard"] as const,
  qrPayload: ["qrPayload"] as const,
};

/** Invalidate every query that a money movement can change. */
function invalidateMoney(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.balance });
  void queryClient.invalidateQueries({ queryKey: queryKeys.walletSummary });
  void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
  void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
  void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
  void queryClient.invalidateQueries({ queryKey: queryKeys.incomingRequests });
  void queryClient.invalidateQueries({ queryKey: queryKeys.outgoingRequests });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Profile | null>({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    Profile,
    Error,
    { input: ProfileInput; startingBalance: bigint }
  >({
    mutationFn: async ({ input, startingBalance }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createCallerProfile(input, startingBalance);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      invalidateMoney(queryClient);
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<Profile | null, Error, ProfileInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateCallerProfile(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
}

export function useBalance() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<bigint>({
    queryKey: queryKeys.balance,
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWalletSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WalletSummary>({
    queryKey: queryKeys.walletSummary,
    queryFn: async () => {
      if (!actor) return { balance: 0n, transactionCount: 0n };
      return actor.getWalletSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTransactions() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Transaction[]>({
    queryKey: queryKeys.transactions,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFriends() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Friend[]>({
    queryKey: queryKeys.friends,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFriends();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchFriend() {
  const { actor } = useActor(createActor);
  return useMutation<FriendSearchResult | null, Error, string>({
    mutationFn: async (username) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.searchFriendByUsername(username);
    },
  });
}

export function useResolveFriendQr() {
  const { actor } = useActor(createActor);
  return useMutation<FriendSearchResult | null, Error, string>({
    mutationFn: async (payload) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.resolveFriendQr(payload);
    },
  });
}

export function useAddFriend() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    { __kind__: "ok"; ok: Friend } | { __kind__: "err"; err: AddFriendError },
    Error,
    UserId
  >({
    mutationFn: async (friend) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addFriend(friend);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
    },
  });
}

export function useRemoveFriend() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, UserId>({
    mutationFn: async (friend) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeFriend(friend);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
    },
  });
}

export function useMyQrPayload() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string>({
    queryKey: queryKeys.qrPayload,
    queryFn: async () => {
      if (!actor) return "";
      return actor.getMyQrPayload();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMoney() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    | { __kind__: "ok"; ok: Transaction }
    | { __kind__: "err"; err: TransferError },
    Error,
    { recipient: UserId; amount: bigint; note: string }
  >({
    mutationFn: async ({ recipient, amount, note }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.sendMoney(recipient, amount, note);
    },
    onSuccess: () => {
      invalidateMoney(queryClient);
    },
  });
}

export function useRequestMoney() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    MoneyRequest,
    Error,
    { fromUser: UserId; amount: bigint; note: string }
  >({
    mutationFn: async ({ fromUser, amount, note }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.requestMoney(fromUser, amount, note);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.outgoingRequests,
      });
    },
  });
}

export function useIncomingRequests() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MoneyRequest[]>({
    queryKey: queryKeys.incomingRequests,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listIncomingRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOutgoingRequests() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MoneyRequest[]>({
    queryKey: queryKeys.outgoingRequests,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOutgoingRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAcceptRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    | { __kind__: "ok"; ok: Transaction }
    | { __kind__: "err"; err: RequestError },
    Error,
    bigint
  >({
    mutationFn: async (requestId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.acceptRequest(requestId);
    },
    onSuccess: () => {
      invalidateMoney(queryClient);
    },
  });
}

export function useDeclineRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: RequestError },
    Error,
    bigint
  >({
    mutationFn: async (requestId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.declineRequest(requestId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.incomingRequests,
      });
    },
  });
}

export function useMyCard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Card | null>({
    queryKey: queryKeys.card,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyCard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCard() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<Card, Error, CardInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveMyCard(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.card });
    },
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LeaderboardEntry[]>({
    queryKey: queryKeys.leaderboard,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile(user: UserId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ProfileView | null>({
    queryKey: ["userProfile", user?.toText() ?? "none"],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}
