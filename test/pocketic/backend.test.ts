import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

const alice = createIdentity("alice");
const bob = createIdentity("bob");
const carol = createIdentity("carol");

let pic: PocketIc | undefined;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];
let aliceActor: Actor<_SERVICE>;
let bobActor: Actor<_SERVICE>;
let carolActor: Actor<_SERVICE>;

const aliceProfile = {
  fullName: "Alice",
  classSection: "12-A",
  rollNumber: 1n,
  instagramId: "@alice",
};
const bobProfile = {
  fullName: "Bob",
  classSection: "12-B",
  rollNumber: 2n,
  instagramId: "@bob",
};

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  });
  canisterId = installed.canisterId;
  aliceActor = await registerCaller(
    pic.createActor<_SERVICE>(idlFactory, canisterId),
    alice,
  );
  bobActor = await registerCaller(
    pic.createActor<_SERVICE>(idlFactory, canisterId),
    bob,
  );
  carolActor = await registerCaller(
    pic.createActor<_SERVICE>(idlFactory, canisterId),
    carol,
  );
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(aliceActor.getCallerProfile()).resolves.toEqual([]);
  await expect(aliceActor.getBalance()).resolves.toBe(0n);
  await expect(aliceActor.listTransactions()).resolves.toEqual([]);
  await expect(aliceActor.listFriends()).resolves.toEqual([]);
  await expect(aliceActor.listIncomingRequests()).resolves.toEqual([]);
  await expect(aliceActor.listOutgoingRequests()).resolves.toEqual([]);
  await expect(aliceActor.getMyCard()).resolves.toEqual([]);
});

it("creates a profile and seeds the chosen starting balance", async () => {
  const profile = await aliceActor.createCallerProfile(aliceProfile, 10_000n);
  expect(profile).toMatchObject({
    fullName: "Alice",
    classSection: "12-A",
    rollNumber: 1n,
    instagramId: "@alice",
    startingBalance: 10_000n,
  });
  await expect(aliceActor.getBalance()).resolves.toBe(10_000n);
  await expect(aliceActor.getCallerProfile()).resolves.toEqual([profile]);
});

it("sends money and records it in both histories", async () => {
  await bobActor.createCallerProfile(bobProfile, 1_000n);
  const result = await aliceActor.sendMoney(bob.getPrincipal(), 500n, "For samosa party");
  expect(result).toHaveProperty("ok");
  if (!("ok" in result)) throw new Error("expected ok");

  await expect(aliceActor.getBalance()).resolves.toBe(9_500n);
  await expect(bobActor.getBalance()).resolves.toBe(1_500n);

  const aliceTx = await aliceActor.listTransactions();
  expect(aliceTx).toHaveLength(1);
  expect(aliceTx[0]).toMatchObject({
    direction: { sent: null },
    amount: 500n,
    note: "For samosa party",
    counterpartyName: "Bob",
  });

  const bobTx = await bobActor.listTransactions();
  expect(bobTx).toHaveLength(1);
  expect(bobTx[0]).toMatchObject({
    direction: { received: null },
    amount: 500n,
    note: "For samosa party",
    counterpartyName: "Alice",
  });
});

it("rejects a transfer above the sender's balance and leaves it unchanged", async () => {
  const result = await aliceActor.sendMoney(bob.getPrincipal(), 1_000_000n, "too much");
  expect(result).toEqual({
    err: { insufficientBalance: { balance: 9_500n } },
  });
  await expect(aliceActor.getBalance()).resolves.toBe(9_500n);
});

it("adds a friend by username and by QR payload, then removes them", async () => {
  const search = await aliceActor.searchFriendByUsername("bob");
  expect(search).toHaveLength(1);
  expect(search[0]).toMatchObject({ fullName: "Bob", instagramId: "@bob" });

  const added = await aliceActor.addFriend(bob.getPrincipal());
  expect(added).toHaveProperty("ok");
  const friends = await aliceActor.listFriends();
  expect(friends).toHaveLength(1);
  expect(friends[0]).toMatchObject({ fullName: "Bob", balance: 1_500n });

  const qrPayload = await bobActor.getMyQrPayload();
  const resolved = await aliceActor.resolveFriendQr(qrPayload);
  expect(resolved).toHaveLength(1);
  expect(resolved[0]).toMatchObject({ fullName: "Bob" });

  await expect(aliceActor.removeFriend(bob.getPrincipal())).resolves.toBe(true);
  await expect(aliceActor.listFriends()).resolves.toEqual([]);
});

it("creates a pending request the recipient can accept", async () => {
  const request = await aliceActor.requestMoney(bob.getPrincipal(), 200n, "Paisa do yaar");
  expect(request).toMatchObject({
    amount: 200n,
    note: "Paisa do yaar",
    status: { pending: null },
    fromName: "Alice",
  });

  const incoming = await bobActor.listIncomingRequests();
  expect(incoming).toHaveLength(1);
  expect(incoming[0].id).toBe(request.id);

  const accepted = await bobActor.acceptRequest(request.id);
  expect(accepted).toHaveProperty("ok");
  await expect(bobActor.getBalance()).resolves.toBe(1_300n);
  await expect(aliceActor.getBalance()).resolves.toBe(9_700n);
});

it("saves a card and returns it on read", async () => {
  const card = await aliceActor.saveMyCard({
    title: "Kanjoos Card",
    background: "linear-gradient(135deg,#ff2fb3,#7c4dff)",
    logo: "💳",
    stickers: ["💸", "🔥"],
  });
  expect(card).toMatchObject({ title: "Kanjoos Card", logo: "💳" });
  const read = await aliceActor.getMyCard();
  expect(read).toHaveLength(1);
  expect(read[0]).toMatchObject({ title: "Kanjoos Card", stickers: ["💸", "🔥"] });
});

it("ranks the leaderboard by balance, highest first", async () => {
  const entries = await aliceActor.getLeaderboard();
  const names = entries.map((entry) => entry.fullName);
  expect(names).toEqual(["Alice", "Bob"]);
  expect(entries[0].balance).toBeGreaterThanOrEqual(entries[1].balance);
  expect(entries[0].rank).toBe(1n);
});

it("does not expose one caller's wallet or friends to another", async () => {
  await expect(carolActor.getBalance()).resolves.toBe(0n);
  await expect(carolActor.listTransactions()).resolves.toEqual([]);
  await expect(carolActor.listFriends()).resolves.toEqual([]);
  await expect(carolActor.getMyCard()).resolves.toEqual([]);
  await expect(carolActor.getCallerProfile()).resolves.toEqual([]);
});

it("rejects an anonymous caller on a guarded method", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.getBalance()).rejects.toThrow();
});
