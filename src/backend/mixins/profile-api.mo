import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/profile";
import Common "../types/common";
import ProfileLib "../lib/profile";
import WalletLib "../lib/wallet";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, Types.Profile>,
  balances : Map.Map<Common.UserId, Common.Amount>,
) {
  /// Returns the caller's onboarding profile, or null when not yet onboarded.
  public query ({ caller }) func getCallerProfile() : async ?Types.Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    ProfileLib.getProfile(profiles, caller);
  };

  /// Creates the caller's profile on first onboarding with a starting balance.
  public shared ({ caller }) func createCallerProfile(
    input : Types.ProfileInput,
    startingBalance : Common.Amount,
  ) : async Types.Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create a profile");
    };
    let profile = ProfileLib.createProfile(profiles, caller, input, startingBalance, Time.now());
    // Seed the wallet with the chosen starting balance on first onboarding.
    switch (balances.get(caller)) {
      case null { WalletLib.setBalance(balances, caller, startingBalance) };
      case (?_) {};
    };
    profile;
  };

  /// Updates the editable fields of the caller's profile.
  public shared ({ caller }) func updateCallerProfile(input : Types.ProfileInput) : async ?Types.Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update their profile");
    };
    ProfileLib.updateProfile(profiles, caller, input);
  };

  /// Returns another user's public profile view.
  public query ({ caller }) func getUserProfile(user : Common.UserId) : async ?Types.ProfileView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (ProfileLib.getProfile(profiles, user)) {
      case (?profile) { ?ProfileLib.toView(user, profile) };
      case null { null };
    };
  };
};
