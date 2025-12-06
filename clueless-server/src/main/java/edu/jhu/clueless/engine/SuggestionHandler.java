package edu.jhu.clueless.engine;

import java.util.*;

// SuggestionHandler processes player suggestions and determines validity and possible disproofs
public class SuggestionHandler {
    private final GameState state;

    public SuggestionHandler(GameState state) {
        this.state = state;
    }

    public SuggestionResult handleSuggestion(String suggestingPlayer, String suspect, String weapon, String room) {
        // Validate suspect against canonical suspects (not just players)
        if (suspect == null || !state.getAllSuspects().contains(suspect.toUpperCase())) {
            return SuggestionResult.rejected("Invalid suspect");
        }

        // Move suspect token into the room (suspects are independent tokens)
        state.setSuspectPosition(suspect.toUpperCase(), room);

        // Existing logic: attempt to find a disproof card from other players' hands
        // (Implementation depends on your card model; ensure you check players' hands for suspect/weapon/room cards)
        Optional<Disprove> disprove = findDisprover(suggestingPlayer, suspect, weapon, room);

        if (disprove.isPresent()) {
            return SuggestionResult.accepted(disprove.get());
        } else {
            return SuggestionResult.acceptedNoDisproof();
        }
    }

    private Optional<Disprove> findDisprover(String suggestingPlayer, String suspect, String weapon, String room) {
        // iterate players (in turn order) excluding suggestingPlayer
        for (Player p : state.getPlayers().values()) {
            if (p.getName().equals(suggestingPlayer)) continue;
            if (!p.isActive()) continue;
            // check player's hand for cards matching suspect/weapon/room names
            List<String> matches = new ArrayList<>();
            for (Card c : p.getHand()) {
                String cardName = c.getName().toUpperCase();
                if (cardName.equals(suspect.toUpperCase()) || cardName.equals(weapon.toUpperCase()) || cardName.equals(room.toUpperCase())) {
                    matches.add(cardName);
                }
            }
            if (!matches.isEmpty()) {
                // return first match or random selection per rules
                return Optional.of(new Disprove(p.getName(), matches.get(0)));
            }
        }
        return Optional.empty();
    }
}
