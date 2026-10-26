import Common "common";

module {
  /// Direction of a transaction from the perspective of the wallet owner.
  public type Direction = {
    #sent;
    #received;
  };

  /// A single fake-money transfer recorded in a user's history.
  public type Transaction = {
    id : Nat;
    direction : Direction;
    counterparty : Common.UserId;
    counterpartyName : Text;
    amount : Common.Amount;
    note : Text;
    timestamp : Common.Timestamp;
  };

  /// Wallet summary for the signed-in user.
  public type WalletSummary = {
    balance : Common.Amount;
    transactionCount : Nat;
  };
};
