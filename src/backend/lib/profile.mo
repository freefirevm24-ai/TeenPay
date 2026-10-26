import Map "mo:core/Map";
import Types "../types/profile";
import Common "../types/common";

module {
  /// Returns the caller's profile, or null when onboarding has not happened.
  public func getProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    caller : Common.UserId,
  ) : ?Types.Profile {
    profiles.get(caller);
  };

  /// Creates the caller's profile on first onboarding.
  public func createProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    caller : Common.UserId,
    input : Types.ProfileInput,
    startingBalance : Common.Amount,
    now : Common.Timestamp,
  ) : Types.Profile {
    let profile : Types.Profile = {
      fullName = input.fullName;
      classSection = input.classSection;
      rollNumber = input.rollNumber;
      instagramId = input.instagramId;
      startingBalance;
      createdAt = now;
    };
    profiles.add(caller, profile);
    profile;
  };

  /// Updates the editable fields of the caller's profile.
  public func updateProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    caller : Common.UserId,
    input : Types.ProfileInput,
  ) : ?Types.Profile {
    switch (profiles.get(caller)) {
      case (?existing) {
        let updated : Types.Profile = {
          existing with
          fullName = input.fullName;
          classSection = input.classSection;
          rollNumber = input.rollNumber;
          instagramId = input.instagramId;
        };
        profiles.add(caller, updated);
        ?updated;
      };
      case null { null };
    };
  };

  /// Projects a stored profile into its public view.
  public func toView(userId : Common.UserId, profile : Types.Profile) : Types.ProfileView {
    {
      userId;
      fullName = profile.fullName;
      classSection = profile.classSection;
      rollNumber = profile.rollNumber;
      instagramId = profile.instagramId;
    };
  };
};
