import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";

import Common "types/common";
import ProfileTypes "types/profile";
import WalletTypes "types/wallet";
import TransferTypes "types/transfers";
import CardTypes "types/cards";

import ProfileApi "mixins/profile-api";
import WalletApi "mixins/wallet-api";
import FriendsApi "mixins/friends-api";
import TransfersApi "mixins/transfers-api";
import CardsApi "mixins/cards-api";
import LeaderboardApi "mixins/leaderboard-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;

  let profiles : Map.Map<Common.UserId, ProfileTypes.Profile>;
  let balances : Map.Map<Common.UserId, Common.Amount>;
  let history : Map.Map<Common.UserId, List.List<WalletTypes.Transaction>>;
  let friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>;
  let requests : Map.Map<Nat, TransferTypes.MoneyRequest>;
  let cards : Map.Map<Common.UserId, CardTypes.Card>;

  let counters : {
    var nextTxId : Nat;
    var nextRequestId : Nat;
  };

  include MixinAuthorization(accessControlState, null);

  include ProfileApi(accessControlState, profiles, balances);
  include WalletApi(accessControlState, balances, history);
  include FriendsApi(accessControlState, friends, profiles, balances);
  include TransfersApi(accessControlState, requests, balances, history, profiles, counters);
  include CardsApi(accessControlState, cards);
  include LeaderboardApi(accessControlState, profiles, balances);
  include ApiDocMixin();

  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  // Flatten a user's transaction history into one row per transaction.
  func historyRows() : Iter.Iter<(Common.UserId, WalletTypes.Transaction)> {
    history.entries().flatMap(
      func ((userId, txs)) = txs.values().map(func (tx) = (userId, tx))
    );
  };

  // Flatten the friend graph into one row per (owner, friend) edge.
  func friendRows() : Iter.Iter<(Common.UserId, Common.UserId)> {
    friends.entries().flatMap(
      func ((userId, friendSet)) = friendSet.values().map(func (friend) = (userId, friend))
    );
  };

  include Expose({
    entities = [
      // Onboarded profiles — each user reads only their own row.
      OQL.Entity.manual<(Common.UserId, ProfileTypes.Profile)>(
        "profile",
        func () = profiles.entries(),
        "Profile",
        "userId",
      )
        .sample((samplePrincipal, {
          fullName = "";
          classSection = "";
          rollNumber = 0;
          instagramId = "";
          startingBalance = 0;
          createdAt = 0;
        }))
        .payload("userId", func ((userId, _)) = userId)
        .payload("fullName", func ((_, p)) = p.fullName)
        .payload("classSection", func ((_, p)) = p.classSection)
        .payload("rollNumber", func ((_, p)) = p.rollNumber)
        .payload("instagramId", func ((_, p)) = p.instagramId)
        .payload("startingBalance", func ((_, p)) = p.startingBalance)
        .payload("createdAt", func ((_, p)) = p.createdAt)
        .ownedBy("userId")
        .scopedPerUser()
        .build(),
      // Wallet balances — each user reads only their own row.
      OQL.Entity.manual<(Common.UserId, Common.Amount)>(
        "balance",
        func () = balances.entries(),
        "Balance",
        "userId",
      )
        .sample((samplePrincipal, 0))
        .payload("userId", func ((userId, _)) = userId)
        .payload("balance", func ((_, amount)) = amount)
        .ownedBy("userId")
        .scopedPerUser()
        .build(),
      // Transaction history — each user reads only their own rows.
      OQL.Entity.manual<(Common.UserId, WalletTypes.Transaction)>(
        "transaction",
        historyRows,
        "Transaction",
        "id",
      )
        .sample((samplePrincipal, {
          id = 0;
          direction = #sent;
          counterparty = samplePrincipal;
          counterpartyName = "";
          amount = 0;
          note = "";
          timestamp = 0;
        }))
        .payload("id", func ((_, tx)) = tx.id)
        .payload("owner", func ((userId, _)) = userId)
        .payload("direction", func ((_, tx)) = switch (tx.direction) {
          case (#sent) { "sent" };
          case (#received) { "received" };
        })
        .payload("counterparty", func ((_, tx)) = tx.counterparty)
        .payload("counterpartyName", func ((_, tx)) = tx.counterpartyName)
        .payload("amount", func ((_, tx)) = tx.amount)
        .payload("note", func ((_, tx)) = tx.note)
        .payload("timestamp", func ((_, tx)) = tx.timestamp)
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
      // Friend edges — each user reads only their own rows.
      OQL.Entity.manual(
        "friend",
        friendRows,
        "Friend",
        "owner",
      )
        .sample((samplePrincipal, samplePrincipal))
        .payload("owner", func ((userId, _)) = userId)
        .payload("friend", func ((_, friend)) = friend)
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
      // Money requests — the recipient reads their own incoming rows.
      OQL.Entity.manual<TransferTypes.MoneyRequest>(
        "moneyRequest",
        func () = requests.values(),
        "MoneyRequest",
        "id",
      )
        .sample({
          id = 0;
          fromUser = samplePrincipal;
          fromName = "";
          toUser = samplePrincipal;
          amount = 0;
          note = "";
          status = #pending;
          createdAt = 0;
        })
        .payload("id", func (r) = r.id)
        .payload("fromUser", func (r) = r.fromUser)
        .payload("fromName", func (r) = r.fromName)
        .payload("toUser", func (r) = r.toUser)
        .payload("amount", func (r) = r.amount)
        .payload("note", func (r) = r.note)
        .payload("status", func (r) = switch (r.status) {
          case (#pending) { "pending" };
          case (#accepted) { "accepted" };
          case (#declined) { "declined" };
        })
        .payload("createdAt", func (r) = r.createdAt)
        .ownedBy("toUser")
        .scopedPerUser()
        .build(),
      // Custom cards — each user reads only their own row.
      OQL.Entity.manual<(Common.UserId, CardTypes.Card)>(
        "card",
        func () = cards.entries(),
        "Card",
        "owner",
      )
        .sample((samplePrincipal, {
          title = "";
          background = "";
          stickers = [];
          logo = "";
          updatedAt = 0;
        }))
        .payload("owner", func ((userId, _)) = userId)
        .payload("title", func ((_, c)) = c.title)
        .payload("background", func ((_, c)) = c.background)
        .payload("stickerCount", func ((_, c)) = c.stickers.size())
        .payload("logo", func ((_, c)) = c.logo)
        .payload("updatedAt", func ((_, c)) = c.updatedAt)
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
    ];
  });
};
