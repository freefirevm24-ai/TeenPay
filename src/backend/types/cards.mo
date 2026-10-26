import Common "common";

module {
  /// A user-designed virtual debit card.
  public type Card = {
    title : Text;
    background : Text;
    stickers : [Text];
    logo : Text;
    updatedAt : Common.Timestamp;
  };

  /// Input for creating or updating a card.
  public type CardInput = {
    title : Text;
    background : Text;
    stickers : [Text];
    logo : Text;
  };
};
