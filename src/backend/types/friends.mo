import Common "common";

module {
  /// A friend entry in the signed-in user's contact list.
  public type Friend = {
    userId : Common.UserId;
    fullName : Text;
    instagramId : Text;
    balance : Common.Amount;
    addedAt : Common.Timestamp;
  };

  /// Result of a username search used to add a friend.
  public type FriendSearchResult = {
    userId : Common.UserId;
    fullName : Text;
    instagramId : Text;
  };

  /// Errors returned when adding a friend.
  public type AddFriendError = {
    #notFound;
    #alreadyFriend;
    #cannotAddSelf;
  };
};
