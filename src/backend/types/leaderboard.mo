import Common "common";

module {
  /// A single leaderboard row.
  public type LeaderboardEntry = {
    rank : Nat;
    userId : Common.UserId;
    fullName : Text;
    instagramId : Text;
    balance : Common.Amount;
  };
};
