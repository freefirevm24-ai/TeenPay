import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/cards";
import Common "../types/common";
import CardsLib "../lib/cards";

mixin (
  accessControlState : AccessControl.AccessControlState,
  cards : Map.Map<Common.UserId, Types.Card>,
) {
  /// Returns the caller's saved card, or null when none exists.
  public query ({ caller }) func getMyCard() : async ?Types.Card {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their card");
    };
    CardsLib.getCard(cards, caller);
  };

  /// Creates or replaces the caller's card.
  public shared ({ caller }) func saveMyCard(input : Types.CardInput) : async Types.Card {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their card");
    };
    CardsLib.saveCard(cards, caller, input, Time.now());
  };
};
