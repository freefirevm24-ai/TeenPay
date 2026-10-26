import type {
  Card,
  Friend,
  Transaction,
  WalletSummary,
  backendInterface,
} from "@/backend";
import { Direction } from "@/backend";
import { useIncomingAlerts } from "@/hooks/useIncomingAlerts";
import { SoundboxProvider } from "@/lib/soundbox-context";
import { WalletPage } from "@/pages/WalletPage";
import { Principal } from "@icp-sdk/core/principal";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithActor } from "./test-utils";

const bob = Principal.fromText("2vxsx-fae");

const soundboxMock = vi.hoisted(() => ({
  fireSoundbox: vi.fn(),
}));
const confettiMock = vi.hoisted(() => ({
  burstConfetti: vi.fn(),
}));

vi.mock("@/lib/soundbox", () => ({
  fireSoundbox: soundboxMock.fireSoundbox,
  playCashRegister: vi.fn(),
  speak: vi.fn(),
}));
vi.mock("@/lib/confetti", () => ({
  burstConfetti: confettiMock.burstConfetti,
}));

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

/** Minimal consumer of the alert hook so the query cache can drive it directly. */
function AlertHarness() {
  useIncomingAlerts();
  return null;
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
    direction: Direction.received,
    counterparty: bob,
    counterpartyName: "Bhavna Rao",
    amount: 500n,
    note: "For samosa party",
    timestamp: 0n,
    ...overrides,
  };
}

describe("incoming money alerts", () => {
  it("fires the soundbox announcement naming the sender and amount on a new incoming transfer", async () => {
    const received = makeTransaction({
      id: 2n,
      direction: Direction.received,
      amount: 500n,
      counterpartyName: "Bhavna Rao",
    });
    const listTransactions = vi
      .fn<backendInterface["listTransactions"]>()
      .mockResolvedValue([]);
    const actor = {
      listTransactions,
    } satisfies Pick<backendInterface, "listTransactions">;

    const { queryClient } = renderWithActor(
      <SoundboxProvider>
        <AlertHarness />
      </SoundboxProvider>,
      actor,
    );

    // First load seeds the seen set with the empty feed.
    await waitFor(() =>
      expect(queryClient.getQueryData(["transactions"])).toEqual([]),
    );
    expect(soundboxMock.fireSoundbox).not.toHaveBeenCalled();

    // A new incoming transfer arrives and the feed refetches.
    await act(async () => {
      queryClient.setQueryData(["transactions"], [received]);
    });

    await waitFor(() => expect(soundboxMock.fireSoundbox).toHaveBeenCalled());
    const [message, , enabled] = soundboxMock.fireSoundbox.mock.calls[0];
    expect(message).toContain("Bhavna Rao");
    expect(message).toContain("₹500");
    expect(enabled).toBe(true);
  });

  it("does not announce a transfer that was already present on first load", async () => {
    const actor = {
      listTransactions: vi
        .fn<backendInterface["listTransactions"]>()
        .mockResolvedValue([makeTransaction()]),
    } satisfies Pick<backendInterface, "listTransactions">;

    const { queryClient } = renderWithActor(
      <SoundboxProvider>
        <AlertHarness />
      </SoundboxProvider>,
      actor,
    );

    await waitFor(() =>
      expect(queryClient.getQueryData(["transactions"])).toHaveLength(1),
    );
    expect(soundboxMock.fireSoundbox).not.toHaveBeenCalled();
  });
});

describe("confetti on large transfers", () => {
  it("bursts confetti when sending a large transfer", async () => {
    const user = userEvent.setup();
    const friend = makeFriend();
    const sendMoney = vi.fn<backendInterface["sendMoney"]>().mockResolvedValue({
      __kind__: "ok",
      ok: makeTransaction({ direction: Direction.sent, amount: 6_000n }),
    });
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
    await user.type(within(dialog).getByTestId("send.amount_input"), "6000");
    await user.click(within(dialog).getByTestId("send.submit_button"));

    await waitFor(() => expect(sendMoney).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(confettiMock.burstConfetti).toHaveBeenCalled());
  });

  it("does not burst confetti for a small transfer", async () => {
    const user = userEvent.setup();
    const friend = makeFriend();
    const sendMoney = vi.fn<backendInterface["sendMoney"]>().mockResolvedValue({
      __kind__: "ok",
      ok: makeTransaction({ direction: Direction.sent, amount: 500n }),
    });
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
    await user.click(within(dialog).getByTestId("send.submit_button"));

    await waitFor(() => expect(sendMoney).toHaveBeenCalledTimes(1));
    expect(confettiMock.burstConfetti).not.toHaveBeenCalled();
  });
});

describe("saved card on the wallet screen", () => {
  it("shows the customized card returned by the backend", async () => {
    const card: Card = {
      title: "Kanjoos Card",
      background: "linear-gradient(135deg,#ff2fb3,#7c4dff)",
      logo: "💳",
      stickers: ["💸", "🔥"],
      updatedAt: 0n,
    };
    const summary: WalletSummary = { balance: 10_000n, transactionCount: 0n };
    const actor = {
      getWalletSummary: vi
        .fn<backendInterface["getWalletSummary"]>()
        .mockResolvedValue(summary),
      listTransactions: vi
        .fn<backendInterface["listTransactions"]>()
        .mockResolvedValue([]),
      listFriends: vi
        .fn<backendInterface["listFriends"]>()
        .mockResolvedValue([]),
      getMyCard: vi.fn<backendInterface["getMyCard"]>().mockResolvedValue(card),
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

    const savedCard = await screen.findByTestId("wallet.saved_card");
    expect(within(savedCard).getByText("Kanjoos Card")).toBeInTheDocument();
    expect(within(savedCard).getByText("💳")).toBeInTheDocument();
  });
});
