import Common "common";

module {
  /// Onboarding profile for a signed-in user.
  public type Profile = {
    fullName : Text;
    classSection : Text;
    rollNumber : Nat;
    instagramId : Text;
    startingBalance : Common.Amount;
    createdAt : Common.Timestamp;
  };

  /// Editable subset of the profile (starting balance is fixed at onboarding).
  public type ProfileInput = {
    fullName : Text;
    classSection : Text;
    rollNumber : Nat;
    instagramId : Text;
  };

  /// Public view of a user's profile, safe to share with friends.
  public type ProfileView = {
    userId : Common.UserId;
    fullName : Text;
    classSection : Text;
    rollNumber : Nat;
    instagramId : Text;
  };
};
