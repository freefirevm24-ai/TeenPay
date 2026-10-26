import Map "mo:core/Map";
import Types "../types/cards";
import Common "../types/common";

module {
  /// Returns the caller's saved card, or null when none exists.
  public func getCard(
    cards : Map.Map<Common.UserId, Types.Card>,
    caller : Common.UserId,
  ) : ?Types.Card {
    cards.get(caller);
  };

  /// Creates or replaces the caller's card.
  public func saveCard(
    cards : Map.Map<Common.UserId, Types.Card>,
    caller : Common.UserId,
    input : Types.CardInput,
    now : Common.Timestamp,
  ) : Types.Card {
    let card : Types.Card = {
      title = input.title;
      background = input.background;
      stickers = input.stickers;
      logo = input.logo;
      updatedAt = now;
    };
    cards.add(caller, card);
    card;
  };
};
