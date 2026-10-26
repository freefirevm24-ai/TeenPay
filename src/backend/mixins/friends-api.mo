import Map "mo:core/Map";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/friends";
import ProfileTypes "../types/profile";
import Common "../types/common";
import FriendsLib "../lib/friends";

mixin (
  accessControlState : AccessControl.AccessControlState,
  friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  balances : Map.Map<Common.UserId, Common.Amount>,
) {
  /// Searches for a user by username to add as a friend.
  public query ({ caller }) func searchFriendByUsername(username : Text) : async ?Types.FriendSearchResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search for friends");
    };
    FriendsLib.searchByUsername(profiles, caller, username);
  };

  /// Resolves a scanned QR payload to a user that can be added as a friend.
  public query ({ caller }) func resolveFriendQr(payload : Text) : async ?Types.FriendSearchResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can scan friend QR codes");
    };
    FriendsLib.resolveQrPayload(profiles, caller, payload);
  };

  /// Adds a friend to the caller's list.
  public shared ({ caller }) func addFriend(friend : Common.UserId) : async { #ok : Types.Friend; #err : Types.AddFriendError } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add friends");
    };
    FriendsLib.addFriend(friends, profiles, caller, friend, Time.now());
  };

  /// Removes a friend from the caller's list.
  public shared ({ caller }) func removeFriend(friend : Common.UserId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove friends");
    };
    FriendsLib.removeFriend(friends, caller, friend);
  };

  /// Lists the caller's friends with their current balances.
  public query ({ caller }) func listFriends() : async [Types.Friend] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their friends");
    };
    FriendsLib.listFriends(friends, profiles, balances, caller);
  };

  /// Returns the caller's personal QR payload that others can scan.
  public query ({ caller }) func getMyQrPayload() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their QR code");
    };
    FriendsLib.getMyQrPayload(caller);
  };
};
