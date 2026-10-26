import Common "common";

module {
  /// Errors returned when sending virtual money.
  public type TransferError = {
    #insufficientBalance : { balance : Common.Amount };
    #recipientNotFound;
    #cannotSendToSelf;
    #invalidAmount;
  };

  /// Status of a money request.
  public type RequestStatus = {
    #pending;
    #accepted;
    #declined;
  };

  /// A request for virtual money from one user to another.
  public type MoneyRequest = {
    id : Nat;
    fromUser : Common.UserId;
    fromName : Text;
    toUser : Common.UserId;
    amount : Common.Amount;
    note : Text;
    status : RequestStatus;
    createdAt : Common.Timestamp;
  };

  /// Errors returned when responding to a money request.
  public type RequestError = {
    #notFound;
    #notRecipient;
    #alreadyResolved;
    #insufficientBalance : { balance : Common.Amount };
  };
};
