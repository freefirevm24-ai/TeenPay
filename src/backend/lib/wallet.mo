import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types/wallet";
import Common "../types/common";

module {
  /// Returns the caller's current fake balance (0 when no wallet exists yet).
  public func getBalance(
    balances : Map.Map<Common.UserId, Common.Amount>,
    caller : Common.UserId,
  ) : Common.Amount {
    balances.get(caller) ?? 0;
  };

  /// Sets the caller's starting balance during onboarding.
  public func setBalance(
    balances : Map.Map<Common.UserId, Common.Amount>,
    caller : Common.UserId,
    amount : Common.Amount,
  ) : () {
    balances.add(caller, amount);
  };

  /// Credits an amount to a user's balance.
  public func credit(
    balances : Map.Map<Common.UserId, Common.Amount>,
    user : Common.UserId,
    amount : Common.Amount,
  ) : () {
    let current = balances.get(user) ?? 0;
    balances.add(user, current + amount);
  };

  /// Debits an amount from a user's balance, returning false when insufficient.
  public func debit(
    balances : Map.Map<Common.UserId, Common.Amount>,
    user : Common.UserId,
    amount : Common.Amount,
  ) : Bool {
    let current = balances.get(user) ?? 0;
    if (amount > current) {
      false;
    } else {
      balances.add(user, (current.toInt() - amount.toInt()).toNat());
      true;
    };
  };

  /// Appends a transaction to a user's history.
  public func recordTransaction(
    history : Map.Map<Common.UserId, List.List<Types.Transaction>>,
    counters : { var nextTxId : Nat },
    user : Common.UserId,
    direction : Types.Direction,
    counterparty : Common.UserId,
    counterpartyName : Text,
    amount : Common.Amount,
    note : Text,
    now : Common.Timestamp,
  ) : () {
    let tx : Types.Transaction = {
      id = counters.nextTxId;
      direction;
      counterparty;
      counterpartyName;
      amount;
      note;
      timestamp = now;
    };
    counters.nextTxId += 1;
    let list = switch (history.get(user)) {
      case (?existing) { existing };
      case null {
        let fresh = List.empty<Types.Transaction>();
        history.add(user, fresh);
        fresh;
      };
    };
    list.add(tx);
  };

  /// Returns a user's transaction history, newest first.
  public func listTransactions(
    history : Map.Map<Common.UserId, List.List<Types.Transaction>>,
    caller : Common.UserId,
  ) : [Types.Transaction] {
    let list = switch (history.get(caller)) {
      case (?existing) { existing };
      case null { List.empty<Types.Transaction>() };
    };
    let snapshot = list.toArray();
    snapshot.reverse();
  };

  /// Returns the caller's wallet summary.
  public func getSummary(
    balances : Map.Map<Common.UserId, Common.Amount>,
    history : Map.Map<Common.UserId, List.List<Types.Transaction>>,
    caller : Common.UserId,
  ) : Types.WalletSummary {
    let count = switch (history.get(caller)) {
      case (?existing) { existing.size() };
      case null { 0 };
    };
    {
      balance = balances.get(caller) ?? 0;
      transactionCount = count;
    };
  };
};
