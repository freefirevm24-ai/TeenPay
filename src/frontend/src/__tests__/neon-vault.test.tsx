import type {
  AddFriendError,
  Card,
  Friend,
  FriendSearchResult,
  LeaderboardEntry,
  MoneyRequest,
  Profile,
  ProfileInput,
  Transaction,
  TransferError,
  UserId,
  WalletSummary,
  backendInterface,
} from "@/backend";
import { Direction, RequestStatus } from "@/backend";
import { SoundboxProvider } from "@/lib/soundbox-context";
import { CardPage } from "@/pages/CardPage";
import { FriendsPage } from "@/pages/FriendsPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ScanPage } from "@/pages/ScanPage";
import { WalletPage } from "@/pages/WalletPage";
import { Principal } from "@icp-sdk/core/principal";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithActor } from "./test-utils";

const qrMock = vi.hoisted(() => ({
  payload: "vpay:friend:2vxsx-fae",
}));

vi.mock("@/lib/qr", () => ({
  createQrDecoder: async () => ({
    kind: "native" as const,
    decode: async () => qrMock.payload,
  }),
}));

const alice = Principal.fromText("aaaaa-aa");
const bob = Principal.fromText("2vxsx-fae");

function wrap(ui: ReactElement) {
  return <SoundboxProvider>{ui}</SoundboxProvider>;
}

/** Pages that render <Link> need a router context; mount the page as a route. */
function wrapRouted(ui: ReactElement) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
  });
  return (
    <SoundboxProvider>
      <RouterProvider router={router} />
    </SoundboxProvider>
  );
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    fullName: "Aarav Sharma",
    classSection: "12-B",
    rollNumber: 27n,
    instagramId: "@aarav",
    startingBalance: 10_000n,
    createdAt: 0n,
    ...overrides,
  };
}

function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    userId: bob,
    fullName: "Bhavna Rao",
    instagramId: "@bhavna",
    balance: 2_000n,
    addedAt: 0n,
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1n,
    direction: Direction.sent,
    counterparty: bob,
    counterpartyName: "Bhavna Rao",
    amount: 500n,
    note: "For samosa party",
    timestamp: 0n,
    ...overrides,
  };
}

describe("OnboardingPage", () => {
  it("shows the required fields with placeholders and blocks submit until filled", async () => {
    const user = userEvent.setup();
    const createCallerProfile =
      vi.fn<backendInterface["createCallerProfile"]>();
    renderWithActor(wrap(<OnboardingPage />), {
      createCallerProfile,
    } satisfies Pick<backendInterface, "createCallerProfile">);

    expect(screen.getByTestId("onboarding.full_name_input")).toHaveAttribute(
      "placeholder",
      "e.g. Aarav Sharma",
    );
    expect(
      screen.getByTestId("onboarding.class_section_input"),
    ).toHaveAttribute("placeholder", "e.g. 12-B");
    expect(screen.getByTestId("onboarding.roll_number_input")).toHaveAttribute(
      "placeholder",
      "e.g. 27",
    );
    expect(screen.getByTestId("onboarding.instagram_input")).toHaveAttribute(
      "placeholder",
      "@yourhandle",
    );

    const submit = screen.getByTestId("onboarding.submit_button");
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByTestId("onboarding.full_name_input"),
      "Aarav Sharma",
    );
    await user.type(
      screen.getByTestId("onboarding.class_section_input"),
      "12-B",
    );
    await user.type(screen.getByTestId("onboarding.roll_number_input"), "27");
    await user.type(screen.getByTestId("onboarding.instagram_input"), "@aarav");

    expect(submit).toBeEnabled();
    expect(createCallerProfile).not.toHaveBeenCalled();
  });

  it("submits the profile with the chosen starting balance", async () => {
    const user = userEvent.setup();
    const createCallerProfile = vi
      .fn<backendInterface["createCallerProfile"]>()
      .mockResolvedValue(makeProfile());
    renderWithActor(wrap(<OnboardingPage />), {
      createCallerProfile,
    } satisfies Pick<backendInterface, "createCallerProfile">);

    await user.type(
      screen.getByTestId("onboarding.full_name_input"),
      "Aarav Sharma",
    );
    await user.type(
      screen.getByTestId("onboarding.class_section_input"),
      "12-B",
    );
    await user.type(screen.getByTestId("onboarding.roll_number_input"), "27");
    await user.type(screen.getByTestId("onboarding.instagram_input"), "@aarav");
    await user.click(screen.getByTestId("onboarding.balance_preset.500"));
    await user.click(screen.getByTestId("onboarding.submit_button"));

    await waitFor(() => expect(createCallerProfile).toHaveBeenCalledTimes(1));
    const [input, startingBalance] = createCallerProfile.mock.calls[0];
    expect(input).toEqual<ProfileInput>({
      fullName: "Aarav Sharma",
      classSection: "12-B",
      rollNumber: 27n,
      instagramId: "@aarav",
    });
    expect(startingBalance).toBe(500n);
  });
});

describe("WalletPage", () => {
  it("shows the balance and transaction history with note and counterparty", async () => {
    const summary: WalletSummary = { balance: 9_500n, transactionCount: 1n };
    const actor = {
      getWalletSummary: vi
        .fn<backendInterface["getWalletSummary"]>()
        .mockResolvedValue(summary),
      listTransactions: vi
        .fn<backendInterface["listTransactions"]>()
        .mockResolvedValue([makeTransaction()]),
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([]),
      getMyCard: vi.fn<backendInterface["getMyCard"]>().mockResolvedValue(null),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([]),
    } satisfies Pick<
      backendInterface,
      | "getWalletSummary"
      | "listTransactions"
      | "listFriends"
      | "getMyCard"
      | "listIncomingRequests"
    >;

    renderWithActor(wrapRouted(<WalletPage />), actor);

    expect(await screen.findByText("₹9,500")).toBeInTheDocument();
    const list = await screen.findByTestId("wallet.transactions_list");
    expect(within(list).getByText("Bhavna Rao")).toBeInTheDocument();
    expect(within(list).getByText(/For samosa party/)).toBeInTheDocument();
  });

  it("shows the empty state when there are no transactions", async () => {
    const actor = {
      getWalletSummary: vi
        .fn<backendInterface["getWalletSummary"]>()
        .mockResolvedValue({ balance: 10_000n, transactionCount: 0n }),
      listTransactions: vi
        .fn<backendInterface["listTransactions"]>()
        .mockResolvedValue([]),
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([]),
      getMyCard: vi.fn<backendInterface["getMyCard"]>().mockResolvedValue(null),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([]),
    } satisfies Pick<
      backendInterface,
      | "getWalletSummary"
      | "listTransactions"
      | "listFriends"
      | "getMyCard"
      | "listIncomingRequests"
    >;

    renderWithActor(wrapRouted(<WalletPage />), actor);

    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
  });
});

describe("SendMoneyDialog via WalletPage", () => {
  it("sends money with a fun note and calls the actor with the right args", async () => {
    const user = userEvent.setup();
    const friend = makeFriend();
    const sendMoney = vi
      .fn<backendInterface["sendMoney"]>()
      .mockResolvedValue({ __kind__: "ok", ok: makeTransaction() });
    const actor = {
      getWalletSummary: vi
        .fn<backendInterface["getWalletSummary"]>()
        .mockResolvedValue({ balance: 10_000n, transactionCount: 0n }),
      listTransactions: vi
        .fn<backendInterface["listTransactions"]>()
        .mockResolvedValue([]),
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([friend]),
      getMyCard: vi.fn<backendInterface["getMyCard"]>().mockResolvedValue(null),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([]),
      sendMoney,
    } satisfies Pick<
      backendInterface,
      | "getWalletSummary"
      | "listTransactions"
      | "listFriends"
      | "getMyCard"
      | "listIncomingRequests"
      | "sendMoney"
    >;

    renderWithActor(wrapRouted(<WalletPage />), actor);

    await user.click(await screen.findByTestId("wallet.send_button"));
    const dialog = await screen.findByTestId("send.dialog");
    await user.click(
      within(dialog).getByTestId(
        `send.friend_option.${bob.toText().slice(0, 8)}`,
      ),
    );
    await user.type(within(dialog).getByTestId("send.amount_input"), "500");
    await user.type(
      within(dialog).getByTestId("send.note_input"),
      "For samosa party",
    );
    await user.click(within(dialog).getByTestId("send.submit_button"));

    await waitFor(() => expect(sendMoney).toHaveBeenCalledTimes(1));
    expect(sendMoney).toHaveBeenCalledWith(bob, 500n, "For samosa party");
  });

  it("rejects a transfer above the balance with a visible error", async () => {
    const user = userEvent.setup();
    const friend = makeFriend();
    const err: TransferError = {
      __kind__: "insufficientBalance",
      insufficientBalance: { balance: 1_000n },
    };
    const sendMoney = vi
      .fn<backendInterface["sendMoney"]>()
      .mockResolvedValue({ __kind__: "err", err });
    const actor = {
      getWalletSummary: vi
        .fn<backendInterface["getWalletSummary"]>()
        .mockResolvedValue({ balance: 1_000n, transactionCount: 0n }),
      listTransactions: vi
        .fn<backendInterface["listTransactions"]>()
        .mockResolvedValue([]),
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([friend]),
      getMyCard: vi.fn<backendInterface["getMyCard"]>().mockResolvedValue(null),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([]),
      sendMoney,
    } satisfies Pick<
      backendInterface,
      | "getWalletSummary"
      | "listTransactions"
      | "listFriends"
      | "getMyCard"
      | "listIncomingRequests"
      | "sendMoney"
    >;

    renderWithActor(wrapRouted(<WalletPage />), actor);

    await user.click(await screen.findByTestId("wallet.send_button"));
    const dialog = await screen.findByTestId("send.dialog");
    await user.click(
      within(dialog).getByTestId(
        `send.friend_option.${bob.toText().slice(0, 8)}`,
      ),
    );
    await user.type(within(dialog).getByTestId("send.amount_input"), "5000");
    await user.click(within(dialog).getByTestId("send.submit_button"));

    const error = await within(dialog).findByTestId("send.error_state");
    expect(error).toHaveTextContent(/Not enough fake rupees/i);
    expect(error).toHaveTextContent("₹1,000");
  });
});

describe("FriendsPage", () => {
  it("adds a friend by username and shows them in the crew list", async () => {
    const user = userEvent.setup();
    const result: FriendSearchResult = {
      userId: bob,
      fullName: "Bhavna Rao",
      instagramId: "@bhavna",
    };
    const searchFriendByUsername = vi
      .fn<backendInterface["searchFriendByUsername"]>()
      .mockResolvedValue(result);
    const addFriend = vi
      .fn<backendInterface["addFriend"]>()
      .mockResolvedValue({ __kind__: "ok", ok: makeFriend() });
    const actor = {
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([]),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([]),
      listOutgoingRequests: vi
        .fn<backendInterface["listOutgoingRequests"]>()
        .mockResolvedValue([]),
      getMyQrPayload: vi
        .fn<backendInterface["getMyQrPayload"]>()
        .mockResolvedValue("vpay:friend:aaaaa-aa"),
      searchFriendByUsername,
      addFriend,
    } satisfies Pick<
      backendInterface,
      | "listFriends"
      | "listIncomingRequests"
      | "listOutgoingRequests"
      | "getMyQrPayload"
      | "searchFriendByUsername"
      | "addFriend"
    >;

    renderWithActor(wrapRouted(<FriendsPage />), actor);

    await user.type(
      await screen.findByTestId("friends.search_input"),
      "@bhavna",
    );
    await user.click(screen.getByTestId("friends.add_button"));

    await waitFor(() =>
      expect(searchFriendByUsername).toHaveBeenCalledWith("bhavna"),
    );
    await waitFor(() => expect(addFriend).toHaveBeenCalledWith(bob));
    expect(
      await screen.findByTestId("friends.search_message"),
    ).toHaveTextContent(/Added Bhavna Rao/);
  });

  it("removes a friend from the crew list", async () => {
    const user = userEvent.setup();
    const removeFriend = vi
      .fn<backendInterface["removeFriend"]>()
      .mockResolvedValue(true);
    const actor = {
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([makeFriend()]),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([]),
      listOutgoingRequests: vi
        .fn<backendInterface["listOutgoingRequests"]>()
        .mockResolvedValue([]),
      getMyQrPayload: vi
        .fn<backendInterface["getMyQrPayload"]>()
        .mockResolvedValue("vpay:friend:aaaaa-aa"),
      removeFriend,
    } satisfies Pick<
      backendInterface,
      | "listFriends"
      | "listIncomingRequests"
      | "listOutgoingRequests"
      | "getMyQrPayload"
      | "removeFriend"
    >;

    renderWithActor(wrapRouted(<FriendsPage />), actor);

    await user.click(await screen.findByTestId("friends.remove_button.1"));
    await waitFor(() => expect(removeFriend).toHaveBeenCalledWith(bob));
  });

  it("accepts an incoming money request", async () => {
    const user = userEvent.setup();
    const request: MoneyRequest = {
      id: 7n,
      status: RequestStatus.pending,
      note: "Paisa do yaar",
      createdAt: 0n,
      toUser: alice,
      fromName: "Bhavna Rao",
      fromUser: bob,
      amount: 200n,
    };
    const acceptRequest = vi
      .fn<backendInterface["acceptRequest"]>()
      .mockResolvedValue({ __kind__: "ok", ok: makeTransaction() });
    const actor = {
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([]),
      listIncomingRequests: vi
        .fn<backendInterface["listIncomingRequests"]>()
        .mockResolvedValue([request]),
      listOutgoingRequests: vi
        .fn<backendInterface["listOutgoingRequests"]>()
        .mockResolvedValue([]),
      getMyQrPayload: vi
        .fn<backendInterface["getMyQrPayload"]>()
        .mockResolvedValue("vpay:friend:aaaaa-aa"),
      acceptRequest,
    } satisfies Pick<
      backendInterface,
      | "listFriends"
      | "listIncomingRequests"
      | "listOutgoingRequests"
      | "getMyQrPayload"
      | "acceptRequest"
    >;

    renderWithActor(wrapRouted(<FriendsPage />), actor);

    await user.click(await screen.findByTestId("friends.accept_button.1"));
    await waitFor(() => expect(acceptRequest).toHaveBeenCalledWith(7n));
  });
});

describe("ScanPage", () => {
  it("opens the Send Virtual Money popup pre-filled with the scanned friend", async () => {
    const result: FriendSearchResult = {
      userId: bob,
      fullName: "Bhavna Rao",
      instagramId: "@bhavna",
    };
    const resolveFriendQr = vi
      .fn<backendInterface["resolveFriendQr"]>()
      .mockResolvedValue(result);
    const actor = {
      resolveFriendQr,
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([]),
    } satisfies Pick<backendInterface, "resolveFriendQr" | "listFriends">;

    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    renderWithActor(wrapRouted(<ScanPage />), actor);

    await waitFor(() =>
      expect(resolveFriendQr).toHaveBeenCalledWith(qrMock.payload),
    );

    const dialog = await screen.findByTestId("send.dialog");
    expect(within(dialog).getByText("Bhavna Rao")).toBeInTheDocument();
    expect(within(dialog).getByText("@bhavna")).toBeInTheDocument();
  });
});

describe("CardPage", () => {
  it("saves a customized card and shows the success state", async () => {
    const user = userEvent.setup();
    const saved: Card = {
      title: "Kanjoos Card",
      background: "linear-gradient(135deg,#ff2fb3,#7c4dff)",
      logo: "💳",
      stickers: ["💸", "🔥"],
      updatedAt: 0n,
    };
    const saveMyCard = vi
      .fn<backendInterface["saveMyCard"]>()
      .mockResolvedValue(saved);
    const actor = {
      getMyCard: vi.fn<backendInterface["getMyCard"]>().mockResolvedValue(null),
      saveMyCard,
    } satisfies Pick<backendInterface, "getMyCard" | "saveMyCard">;

    renderWithActor(wrapRouted(<CardPage />), actor);

    await user.click(await screen.findByTestId("card.save_button"));

    await waitFor(() => expect(saveMyCard).toHaveBeenCalledTimes(1));
    expect(saveMyCard.mock.calls[0][0]).toMatchObject({
      title: "Kanjoos Card",
      logo: "💳",
    });
    expect(await screen.findByTestId("card.success_state")).toBeInTheDocument();
  });
});

describe("LeaderboardPage", () => {
  it("lists users ordered by fake balance, highest first", async () => {
    const entries: LeaderboardEntry[] = [
      {
        rank: 1n,
        userId: bob,
        fullName: "Bhavna Rao",
        instagramId: "@bhavna",
        balance: 50_000n,
      },
      {
        rank: 2n,
        userId: alice,
        fullName: "Aarav Sharma",
        instagramId: "@aarav",
        balance: 10_000n,
      },
    ];
    const actor = {
      getLeaderboard: vi
        .fn<backendInterface["getLeaderboard"]>()
        .mockResolvedValue(entries),
      getCallerProfile: vi
        .fn<backendInterface["getCallerProfile"]>()
        .mockResolvedValue(makeProfile()),
    } satisfies Pick<backendInterface, "getLeaderboard" | "getCallerProfile">;

    renderWithActor(wrapRouted(<LeaderboardPage />), actor);

    const list = await screen.findByTestId("leaderboard.list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Bhavna Rao")).toBeInTheDocument();
    expect(within(items[0]).getByText("₹50,000")).toBeInTheDocument();
    expect(within(items[1]).getByText("Aarav Sharma")).toBeInTheDocument();
  });
});
