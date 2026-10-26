import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/transfers";
import WalletTypes "../types/wallet";
import ProfileTypes "../types/profile";
import Common "../types/common";
import TransfersLib "../lib/transfers";

mixin (
  accessControlState : AccessControl.AccessControlState,
  requests : Map.Map<Nat, Types.MoneyRequest>,
  balances : Map.Map<Common.UserId, Common.Amount>,
  history : Map.Map<Common.UserId, List.List<WalletTypes.Transaction>>,
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  counters : { var nextTxId : Nat; var nextRequestId : Nat },
) {
  /// Sends virtual money to a friend with a fun note.
  public shared ({ caller }) func sendMoney(
    recipient : Common.UserId,
    amount : Common.Amount,
    note : Text,
  ) : async { #ok : WalletTypes.Transaction; #err : Types.TransferError } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send money");
    };
    TransfersLib.send(
      balances,
      history,
      profiles,
      counters,
      caller,
      recipient,
      amount,
      note,
      Time.now(),
    );
  };

  /// Requests virtual money from a friend.
  public shared ({ caller }) func requestMoney(
    fromUser : Common.UserId,
    amount : Common.Amount,
    note : Text,
  ) : async Types.MoneyRequest {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can request money");
    };
    TransfersLib.requestMoney(
      requests,
      profiles,
      counters,
      caller,
      fromUser,
      amount,
      note,
      Time.now(),
    );
  };

  /// Lists pending money requests addressed to the caller.
  public query ({ caller }) func listIncomingRequests() : async [Types.MoneyRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their requests");
    };
    TransfersLib.listIncomingRequests(requests, caller);
  };

  /// Lists money requests the caller has sent.
  public query ({ caller }) func listOutgoingRequests() : async [Types.MoneyRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their requests");
    };
    TransfersLib.listOutgoingRequests(requests, caller);
  };

  /// Accepts a pending request, transferring money from the caller to the requester.
  public shared ({ caller }) func acceptRequest(requestId : Nat) : async { #ok : WalletTypes.Transaction; #err : Types.RequestError } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can accept requests");
    };
    TransfersLib.acceptRequest(
      requests,
      balances,
      history,
      profiles,
      counters,
      caller,
      requestId,
      Time.now(),
    );
  };

  /// Declines a pending request addressed to the caller.
  public shared ({ caller }) func declineRequest(requestId : Nat) : async { #ok : (); #err : Types.RequestError } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can decline requests");
    };
    TransfersLib.declineRequest(requests, caller, requestId);
  };
};
