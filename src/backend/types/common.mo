module {
  /// Signed-in user identity.
  public type UserId = Principal;

  /// Nanosecond timestamp from `Time.now()` (signed Int).
  public type Timestamp = Int;

  /// Fake money amount in whole rupees.
  public type Amount = Nat;

  /// Default starting fake balance in rupees.
  public let DEFAULT_STARTING_BALANCE : Amount = 10_000;

  /// Amount at or above which a transfer triggers the confetti celebration.
  public let LARGE_TRANSFER_THRESHOLD : Amount = 1_000;
};
