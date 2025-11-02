# Player Suggestion Flow (Server)

This document describes the server-side flow when a player makes a SUGGESTION, and how other players respond to try to disprove it.

Summary
- Transport: clients send line-delimited JSON ClientMessage objects over TCP.
- Core components involved:
  - ClientHandler: reads/parses message and sends responses to the requesting socket.
  - MessageValidator: validates SUGGESTION structure.
  - MessageRouter: dispatches SUGGESTION to GameEngine / SuggestionHandler and coordinates responses.
  - GameEngine / SuggestionHandler: enforces game rules and runs the multistep reveal protocol.
  - ConnectionRegistry / Subscribers (optional): used to broadcast public updates to all game participants.
  - ServerMessage / GameStateUpdate / ErrorMessage: outbound DTOs.

Inputs (Client -> Server)
- ClientMessage fields (key ones):
  - type: "SUGGESTION"
  - correlationId: string (required)
  - gameId: string (required)
  - playerId: string (the suggester; required)
  - payload: { suspect: string, weapon: string, room: string }
- The server expects the payload to include suspect, weapon, and room strings.

High-level goals
1. Validate the suggestion.
2. Register the suggestion in game state if needed (for logging or UI).
3. Ask other players, in turn order (starting with the next player), to reveal a single card that disproves the suggestion.
4. Stop at first player who can disprove (they privately show one card to the suggester).
5. Notify relevant parties:
   - private response: the suggester receives which card was shown (or an opaque ACK if hide card content is desired).
   - (optional) notify the player who showed a card that they successfully disproved.
   - (optional) broadcast that a suggestion occurred (without revealing the card) to all players.
6. If no player can disprove, return a NO_REVEAL result (used by engine to continue the game).

Step-by-step flow
1) ClientHandler receives raw JSON and parses to ClientMessage.
2) MessageValidator.validate(msg)
   - Ensures msg.type == SUGGESTION
   - correlationId present
   - gameId and playerId present
   - payload contains suspect, weapon, room
3) MessageRouter.route(...) for SUGGESTION:
   - Calls GameEngine.handleSuggestion(gameId, playerId, payload)
   - MessageRouter should immediately (optionally) broadcast a public ServerMessage indicating the suggestion was made:
     - ServerMessage.ok("SUGGESTION_MADE").withCorrelationId(...).withPayload({ playerId, suspect, weapon, room })
4) GameEngine/SuggestionHandler logic:
   - Persist the suggestion in GameState (for logs/UI).
   - Determine the turn order starting from the next active player clockwise.
   - For each candidate player in order:
     a) Query candidate's hand to see if they have any of the suggested cards.
     b) If candidate has no matching cards: continue to next player.
     c) If candidate has one or more matching cards:
         - If game policy is "choose any card to show", and the server can decide, pick one (or ask candidate via client prompt if interactive).
         - The chosen card is privately revealed to the suggester.
         - Stop iterating; return a positive result containing:
             { disprover: candidateId, revealedCard: <card-id-or-name> } (or {disprover: candidateId} if card content must remain hidden)
   - If none can disprove: return { disprover: null } or a NO_REVEAL result.
5) MessageRouter receives result and sends replies:
   - To suggester (private): ServerMessage.ok("SUGGESTION_RESULT")
       .withCorrelationId(...)
       .withPayload(result)
   - To disprover (optional): ServerMessage.ok("SUGGESTION_DISPROVED_ACK")
       .withCorrelationId(...)
       .withPayload({ targetPlayer: playerId, cardShown: <card> (optional) })
   - To all players (optional public broadcast): ServerMessage.ok("SUGGESTION_COMPLETE")
       .withPayload({ playerId: suggester, disprover: candidateId (or null) })
6) GameEngine updates turn state as required and returns control to routing / turn advancement.

Privacy notes
- Revealed card should only be visible to the suggester and optionally to the disprover (not to others).
- If the front end cannot display private messages, consider returning an opaque token and require the client to request the revealed card via a secure channel.

Error handling
- If validator fails: send ServerMessage.error("INVALID", reason).
- If gameId or playerId invalid: send ServerMessage.error("NOT_FOUND", reason).
- If engine throws or unexpected: send ServerMessage.error("UNEXPECTED", "Internal server error").

Pseudocode (SuggestionHandler core)
````java
// SuggestionHandler (inside GameEngine)
Map<String,Object> resolveSuggestion(String gameId, String suggesterId, Map<String,Object> payload) {
  recordSuggestionInState(gameId, suggesterId, payload);
  List<String> order = gameState.getTurnOrderStartingAfter(suggesterId);
  for (String candidate : order) {
    List<Card> matches = gameState.getPlayerHand(candidate).matching(payload.suspect, payload.weapon, payload.room);
    if (!matches.isEmpty()) {
      Card chosen = chooseCardToShow(matches, candidate, suggesterId);
      // return with the chosen card (or hide card content per policy)
      return Map.of("disprover", candidate, "revealedCard", chosen.getName());
    }
  }
  return Map.of("disprover", null); // no one could disprove
}