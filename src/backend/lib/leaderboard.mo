import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Types "../types/leaderboard";
import ProfileTypes "../types/profile";
import Common "../types/common";

module {
  /// Ranks all onboarded users by fake balance, highest first.
  public func getLeaderboard(
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    balances : Map.Map<Common.UserId, Common.Amount>,
  ) : [Types.LeaderboardEntry] {
    let rows = List.empty<Types.LeaderboardEntry>();
    for ((userId, profile) in profiles.entries()) {
      rows.add({
        rank = 0;
        userId;
        fullName = profile.fullName;
        instagramId = profile.instagramId;
        balance = balances.get(userId) ?? 0;
      });
    };
    let sorted = rows.toArray().sort(func(a, b) = Nat.compare(b.balance, a.balance));
    var index = 0;
    sorted.map(func(entry) {
      index += 1;
      { entry with rank = index };
    });
  };
};
