import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Amount = bigint;
export interface Card {
    title: string;
    background: string;
    logo: string;
    updatedAt: Timestamp;
    stickers: Array<string>;
}
export interface CardInput {
    title: string;
    background: string;
    logo: string;
    stickers: Array<string>;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Friend {
    balance: Amount;
    userId: UserId;
    fullName: string;
    addedAt: Timestamp;
    instagramId: string;
}
export interface FriendSearchResult {
    userId: UserId;
    fullName: string;
    instagramId: string;
}
export interface LeaderboardEntry {
    balance: Amount;
    userId: UserId;
    rank: bigint;
    fullName: string;
    instagramId: string;
}
export interface MoneyRequest {
    id: bigint;
    status: RequestStatus;
    note: string;
    createdAt: Timestamp;
    toUser: UserId;
    fromName: string;
    fromUser: UserId;
    amount: Amount;
}
export interface Profile {
    classSection: string;
    createdAt: Timestamp;
    fullName: string;
    rollNumber: bigint;
    startingBalance: Amount;
    instagramId: string;
}
export interface ProfileInput {
    classSection: string;
    fullName: string;
    rollNumber: bigint;
    instagramId: string;
}
export interface ProfileView {
    userId: UserId;
    classSection: string;
    fullName: string;
    rollNumber: bigint;
    instagramId: string;
}
export type RequestError = {
    __kind__: "insufficientBalance";
    insufficientBalance: {
        balance: Amount;
    };
} | {
    __kind__: "alreadyResolved";
    alreadyResolved: null;
} | {
    __kind__: "notRecipient";
    notRecipient: null;
} | {
    __kind__: "notFound";
    notFound: null;
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export interface Transaction {
    id: bigint;
    direction: Direction;
    note: string;
    counterparty: UserId;
    counterpartyName: string;
    timestamp: Timestamp;
    amount: Amount;
}
export type TransferError = {
    __kind__: "insufficientBalance";
    insufficientBalance: {
        balance: Amount;
    };
} | {
    __kind__: "cannotSendToSelf";
    cannotSendToSelf: null;
} | {
    __kind__: "recipientNotFound";
    recipientNotFound: null;
} | {
    __kind__: "invalidAmount";
    invalidAmount: null;
};
export type UserId = Principal;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface WalletSummary {
    balance: Amount;
    transactionCount: bigint;
}
export enum AddFriendError {
    alreadyFriend = "alreadyFriend",
    notFound = "notFound",
    cannotAddSelf = "cannotAddSelf"
}
export enum Direction {
    sent = "sent",
    received = "received"
}
export enum RequestStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Accepts a pending request, transferring money from the caller to the requester.
     */
    acceptRequest(requestId: bigint): Promise<{
        __kind__: "ok";
        ok: Transaction;
    } | {
        __kind__: "err";
        err: RequestError;
    }>;
    /**
     * / Adds a friend to the caller's list.
     */
    addFriend(friend: UserId): Promise<{
        __kind__: "ok";
        ok: Friend;
    } | {
        __kind__: "err";
        err: AddFriendError;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Creates the caller's profile on first onboarding with a starting balance.
     */
    createCallerProfile(input: ProfileInput, startingBalance: Amount): Promise<Profile>;
    /**
     * / Declines a pending request addressed to the caller.
     */
    declineRequest(requestId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: RequestError;
    }>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Static behavioral documentation for the backend API.
     */
    getApiDoc(): Promise<string>;
    /**
     * / Returns the caller's current fake balance.
     */
    getBalance(): Promise<Amount>;
    /**
     * / Returns the caller's onboarding profile, or null when not yet onboarded.
     */
    getCallerProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Ranks all users by fake balance, highest first.
     */
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    /**
     * / Returns the caller's saved card, or null when none exists.
     */
    getMyCard(): Promise<Card | null>;
    /**
     * / Returns the caller's personal QR payload that others can scan.
     */
    getMyQrPayload(): Promise<string>;
    /**
     * / Returns another user's public profile view.
     */
    getUserProfile(user: UserId): Promise<ProfileView | null>;
    /**
     * / Returns the caller's wallet summary (balance and transaction count).
     */
    getWalletSummary(): Promise<WalletSummary>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Lists the caller's friends with their current balances.
     */
    listFriends(): Promise<Array<Friend>>;
    /**
     * / Lists pending money requests addressed to the caller.
     */
    listIncomingRequests(): Promise<Array<MoneyRequest>>;
    /**
     * / Lists money requests the caller has sent.
     */
    listOutgoingRequests(): Promise<Array<MoneyRequest>>;
    /**
     * / Returns the caller's transaction history, newest first.
     */
    listTransactions(): Promise<Array<Transaction>>;
    /**
     * / Removes a friend from the caller's list.
     */
    removeFriend(friend: UserId): Promise<boolean>;
    /**
     * / Requests virtual money from a friend.
     */
    requestMoney(fromUser: UserId, amount: Amount, note: string): Promise<MoneyRequest>;
    /**
     * / Resolves a scanned QR payload to a user that can be added as a friend.
     */
    resolveFriendQr(payload: string): Promise<FriendSearchResult | null>;
    /**
     * / Creates or replaces the caller's card.
     */
    saveMyCard(input: CardInput): Promise<Card>;
    schema(): Promise<string>;
    /**
     * / Searches for a user by username to add as a friend.
     */
    searchFriendByUsername(username: string): Promise<FriendSearchResult | null>;
    /**
     * / Sends virtual money to a friend with a fun note.
     */
    sendMoney(recipient: UserId, amount: Amount, note: string): Promise<{
        __kind__: "ok";
        ok: Transaction;
    } | {
        __kind__: "err";
        err: TransferError;
    }>;
    /**
     * / Updates the editable fields of the caller's profile.
     */
    updateCallerProfile(input: ProfileInput): Promise<Profile | null>;
}
