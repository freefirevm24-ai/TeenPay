import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/wallet";
import Common "../types/common";
import WalletLib "../lib/wallet";

mixin (
  accessControlState : AccessControl.AccessControlState,
  balances : Map.Map<Common.UserId, Common.Amount>,
  history : Map.Map<Common.UserId, List.List<Types.Transaction>>,
) {
  /// Returns the caller's current fake balance.
  public query ({ caller }) func getBalance() : async Common.Amount {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their balance");
    };
    WalletLib.getBalance(balances, caller);
  };

  /// Returns the caller's wallet summary (balance and transaction count).
  public query ({ caller }) func getWalletSummary() : async Types.WalletSummary {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their wallet");
    };
    WalletLib.getSummary(balances, history, caller);
  };

  /// Returns the caller's transaction history, newest first.
  public query ({ caller }) func listTransactions() : async [Types.Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their transactions");
    };
    WalletLib.listTransactions(history, caller);
  };
};
