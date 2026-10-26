import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Types "../types/friends";
import ProfileTypes "../types/profile";
import Common "../types/common";

module {
  /// Prefix used in the personal QR payload so scans can be recognized.
  let QR_PREFIX = "vpay:friend:";

  /// Searches for a user by exact username (full name) to add as a friend.
  public func searchByUsername(
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    caller : Common.UserId,
    username : Text,
  ) : ?Types.FriendSearchResult {
    let term = username.toLower();
    var found : ?Types.FriendSearchResult = null;
    for ((userId, profile) in profiles.entries()) {
      if (found == null and userId != caller and profile.fullName.toLower() == term) {
        found := ?{
          userId;
          fullName = profile.fullName;
          instagramId = profile.instagramId;
        };
      };
    };
    found;
  };

  /// Resolves a scanned QR payload to a user that can be added as a friend.
  public func resolveQrPayload(
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    caller : Common.UserId,
    payload : Text,
  ) : ?Types.FriendSearchResult {
    let trimmed = payload.trim(#char ' ');
    if (not trimmed.startsWith(#text QR_PREFIX)) {
      return null;
    };
    let principalText = trimmed.trimStart(#text QR_PREFIX);
    if (not isPrincipalText(principalText)) {
      return null;
    };
    let userId = Principal.fromText(principalText);
    if (userId == caller) {
      return null;
    };
    switch (profiles.get(userId)) {
      case (?profile) {
        ?{
          userId;
          fullName = profile.fullName;
          instagramId = profile.instagramId;
        };
      };
      case null { null };
    };
  };

  /// Adds a friend to the caller's list.
  public func addFriend(
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    caller : Common.UserId,
    friend : Common.UserId,
    now : Common.Timestamp,
  ) : { #ok : Types.Friend; #err : Types.AddFriendError } {
    if (friend == caller) {
      return #err(#cannotAddSelf);
    };
    let profile = switch (profiles.get(friend)) {
      case (?p) { p };
      case null { return #err(#notFound) };
    };
    let list = switch (friends.get(caller)) {
      case (?existing) { existing };
      case null {
        let fresh = Set.empty<Common.UserId>();
        friends.add(caller, fresh);
        fresh;
      };
    };
    if (list.contains(friend)) {
      return #err(#alreadyFriend);
    };
    list.add(friend);
    #ok({
      userId = friend;
      fullName = profile.fullName;
      instagramId = profile.instagramId;
      balance = 0;
      addedAt = now;
    });
  };

  /// Removes a friend from the caller's list.
  public func removeFriend(
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    caller : Common.UserId,
    friend : Common.UserId,
  ) : Bool {
    switch (friends.get(caller)) {
      case (?list) {
        if (list.contains(friend)) {
          list.remove(friend);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };

  /// Lists the caller's friends with their current balances.
  public func listFriends(
    friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    balances : Map.Map<Common.UserId, Common.Amount>,
    caller : Common.UserId,
  ) : [Types.Friend] {
    let list = switch (friends.get(caller)) {
      case (?existing) { existing };
      case null { Set.empty<Common.UserId>() };
    };
    let result = List.empty<Types.Friend>();
    for (friend in list.values()) {
      switch (profiles.get(friend)) {
        case (?profile) {
          result.add({
            userId = friend;
            fullName = profile.fullName;
            instagramId = profile.instagramId;
            balance = balances.get(friend) ?? 0;
            addedAt = profile.createdAt;
          });
        };
        case null {};
      };
    };
    result.toArray();
  };

  /// Returns the caller's personal QR payload that others can scan.
  public func getMyQrPayload(caller : Common.UserId) : Text {
    QR_PREFIX # caller.toText();
  };

  /// Validates that text looks like a base32 principal before parsing it,
  /// so a malformed QR payload returns null instead of trapping.
  func isPrincipalText(text : Text) : Bool {
    let size = text.size();
    if (size < 7 or size > 63) {
      return false;
    };
    var valid = true;
    for (c in text.toIter()) {
      let isLower = c >= 'a' and c <= 'z';
      let isDigit = c >= '2' and c <= '7';
      let isDash = c == '-';
      if (not (isLower or isDigit or isDash)) {
        valid := false;
      };
    };
    valid;
  };
};
