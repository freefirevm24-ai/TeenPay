import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/leaderboard";
import ProfileTypes "../types/profile";
import Common "../types/common";
import LeaderboardLib "../lib/leaderboard";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  balances : Map.Map<Common.UserId, Common.Amount>,
) {
  /// Ranks all users by fake balance, highest first.
  public query ({ caller }) func getLeaderboard() : async [Types.LeaderboardEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view the leaderboard");
    };
    LeaderboardLib.getLeaderboard(profiles, balances);
  };
};
