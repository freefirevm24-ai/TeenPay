import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";

module {
  // Inlined stable types (migrations must be self-contained).
  type UserId = Principal;
  type Amount = Nat;
  type Timestamp = Int;

  type Profile = {
    fullName : Text;
    classSection : Text;
    rollNumber : Nat;
    instagramId : Text;
    startingBalance : Amount;
    createdAt : Timestamp;
  };

  type Direction = { #sent; #received };

  type Transaction = {
    id : Nat;
    direction : Direction;
    counterparty : UserId;
    counterpartyName : Text;
    amount : Amount;
    note : Text;
    timestamp : Timestamp;
  };

  type RequestStatus = { #pending; #accepted; #declined };

  type MoneyRequest = {
    id : Nat;
    fromUser : UserId;
    fromName : Text;
    toUser : UserId;
    amount : Amount;
    note : Text;
    status : RequestStatus;
    createdAt : Timestamp;
  };

  type Card = {
    title : Text;
    background : Text;
    stickers : [Text];
    logo : Text;
    updatedAt : Timestamp;
  };

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<UserId, Profile>;
    balances : Map.Map<UserId, Amount>;
    history : Map.Map<UserId, List.List<Transaction>>;
    friends : Map.Map<UserId, Set.Set<UserId>>;
    requests : Map.Map<Nat, MoneyRequest>;
    cards : Map.Map<UserId, Card>;
    counters : {
      var nextTxId : Nat;
      var nextRequestId : Nat;
    };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      profiles = Map.empty();
      balances = Map.empty();
      history = Map.empty();
      friends = Map.empty();
      requests = Map.empty();
      cards = Map.empty();
      counters = { var nextTxId = 0; var nextRequestId = 0 };
    };
  };
};
