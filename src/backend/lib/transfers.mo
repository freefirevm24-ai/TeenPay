import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types/transfers";
import WalletTypes "../types/wallet";
import ProfileTypes "../types/profile";
import Common "../types/common";

module {
  /// Sends virtual money from the caller to a recipient.
  public func send(
    balances : Map.Map<Common.UserId, Common.Amount>,
    history : Map.Map<Common.UserId, List.List<WalletTypes.Transaction>>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    counters : { var nextTxId : Nat },
    caller : Common.UserId,
    recipient : Common.UserId,
    amount : Common.Amount,
    note : Text,
    now : Common.Timestamp,
  ) : { #ok : WalletTypes.Transaction; #err : Types.TransferError } {
    if (amount == 0) {
      return #err(#invalidAmount);
    };
    if (recipient == caller) {
      return #err(#cannotSendToSelf);
    };
    let recipientProfile = switch (profiles.get(recipient)) {
      case (?p) { p };
      case null { return #err(#recipientNotFound) };
    };
    let senderName = switch (profiles.get(caller)) {
      case (?p) { p.fullName };
      case null { "" };
    };
    let balance = balances.get(caller) ?? 0;
    if (amount > balance) {
      return #err(#insufficientBalance({ balance }));
    };
    // Debit sender, credit recipient.
    balances.add(caller, (balance.toInt() - amount.toInt()).toNat());
    let recipientBalance = balances.get(recipient) ?? 0;
    balances.add(recipient, recipientBalance + amount);

    // Record the sender's outgoing transaction.
    let sentTx : WalletTypes.Transaction = {
      id = counters.nextTxId;
      direction = #sent;
      counterparty = recipient;
      counterpartyName = recipientProfile.fullName;
      amount;
      note;
      timestamp = now;
    };
    counters.nextTxId += 1;
    appendTx(history, caller, sentTx);

    // Record the recipient's incoming transaction.
    let receivedTx : WalletTypes.Transaction = {
      id = counters.nextTxId;
      direction = #received;
      counterparty = caller;
      counterpartyName = senderName;
      amount;
      note;
      timestamp = now;
    };
    counters.nextTxId += 1;
    appendTx(history, recipient, receivedTx);

    #ok(sentTx);
  };

  /// Creates a money request from the caller to a friend.
  public func requestMoney(
    requests : Map.Map<Nat, Types.MoneyRequest>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    counters : { var nextRequestId : Nat },
    caller : Common.UserId,
    toUser : Common.UserId,
    amount : Common.Amount,
    note : Text,
    now : Common.Timestamp,
  ) : Types.MoneyRequest {
    let fromName = switch (profiles.get(caller)) {
      case (?p) { p.fullName };
      case null { "" };
    };
    let request : Types.MoneyRequest = {
      id = counters.nextRequestId;
      fromUser = caller;
      fromName;
      toUser;
      amount;
      note;
      status = #pending;
      createdAt = now;
    };
    counters.nextRequestId += 1;
    requests.add(request.id, request);
    request;
  };

  /// Lists pending money requests addressed to the caller.
  public func listIncomingRequests(
    requests : Map.Map<Nat, Types.MoneyRequest>,
    caller : Common.UserId,
  ) : [Types.MoneyRequest] {
    let result = List.empty<Types.MoneyRequest>();
    for ((_, request) in requests.entries()) {
      if (request.toUser == caller and request.status == #pending) {
        result.add(request);
      };
    };
    result.toArray();
  };

  /// Lists money requests the caller has sent.
  public func listOutgoingRequests(
    requests : Map.Map<Nat, Types.MoneyRequest>,
    caller : Common.UserId,
  ) : [Types.MoneyRequest] {
    let result = List.empty<Types.MoneyRequest>();
    for ((_, request) in requests.entries()) {
      if (request.fromUser == caller) {
        result.add(request);
      };
    };
    result.toArray();
  };

  /// Accepts a pending request, transferring money from the caller to the requester.
  public func acceptRequest(
    requests : Map.Map<Nat, Types.MoneyRequest>,
    balances : Map.Map<Common.UserId, Common.Amount>,
    history : Map.Map<Common.UserId, List.List<WalletTypes.Transaction>>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    counters : { var nextTxId : Nat },
    caller : Common.UserId,
    requestId : Nat,
    now : Common.Timestamp,
  ) : { #ok : WalletTypes.Transaction; #err : Types.RequestError } {
    let request = switch (requests.get(requestId)) {
      case (?r) { r };
      case null { return #err(#notFound) };
    };
    if (request.toUser != caller) {
      return #err(#notRecipient);
    };
    if (request.status != #pending) {
      return #err(#alreadyResolved);
    };
    let balance = balances.get(caller) ?? 0;
    if (request.amount > balance) {
      return #err(#insufficientBalance({ balance }));
    };
    let payerName = switch (profiles.get(caller)) {
      case (?p) { p.fullName };
      case null { "" };
    };
    // Debit the payer (caller), credit the requester.
    balances.add(caller, (balance.toInt() - request.amount.toInt()).toNat());
    let requesterBalance = balances.get(request.fromUser) ?? 0;
    balances.add(request.fromUser, requesterBalance + request.amount);

    let paidTx : WalletTypes.Transaction = {
      id = counters.nextTxId;
      direction = #sent;
      counterparty = request.fromUser;
      counterpartyName = request.fromName;
      amount = request.amount;
      note = request.note;
      timestamp = now;
    };
    counters.nextTxId += 1;
    appendTx(history, caller, paidTx);

    let receivedTx : WalletTypes.Transaction = {
      id = counters.nextTxId;
      direction = #received;
      counterparty = caller;
      counterpartyName = payerName;
      amount = request.amount;
      note = request.note;
      timestamp = now;
    };
    counters.nextTxId += 1;
    appendTx(history, request.fromUser, receivedTx);

    requests.add(requestId, { request with status = #accepted });
    #ok(paidTx);
  };

  /// Declines a pending request addressed to the caller.
  public func declineRequest(
    requests : Map.Map<Nat, Types.MoneyRequest>,
    caller : Common.UserId,
    requestId : Nat,
  ) : { #ok : (); #err : Types.RequestError } {
    let request = switch (requests.get(requestId)) {
      case (?r) { r };
      case null { return #err(#notFound) };
    };
    if (request.toUser != caller) {
      return #err(#notRecipient);
    };
    if (request.status != #pending) {
      return #err(#alreadyResolved);
    };
    requests.add(requestId, { request with status = #declined });
    #ok(());
  };

  /// Appends a transaction to a user's history, creating the list on first use.
  func appendTx(
    history : Map.Map<Common.UserId, List.List<WalletTypes.Transaction>>,
    user : Common.UserId,
    tx : WalletTypes.Transaction,
  ) : () {
    let list = switch (history.get(user)) {
      case (?existing) { existing };
      case null {
        let fresh = List.empty<WalletTypes.Transaction>();
        history.add(user, fresh);
        fresh;
      };
    };
    list.add(tx);
  };
};
