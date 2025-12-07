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
            return new SuggestionResult(false, suggestingPlayer, suspect, weapon, room, null, null);
        }

        // Move suspect token into the room (suspects are independent tokens)
        state.setSuspectPosition(suspect.toUpperCase(), room);

        // Find disprover and their matching cards
        DisproveInfo disprove = findDisprover(suggestingPlayer, suspect, weapon, room);

        if (disprove != null) {
            // Return accepted with disprover name and candidate cards as CSV
            return new SuggestionResult(true, suggestingPlayer, suspect, weapon, room, disprove.disproverName, disprove.candidateCards);
        } else {
            // No disprover found
            return new SuggestionResult(true, suggestingPlayer, suspect, weapon, room, null, null);
        }
    }

    private DisproveInfo findDisprover(String suggestingPlayer, String suspect, String weapon, String room) {
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
                // Return ALL matching cards as CSV for player to choose from
                String candidatesCsv = String.join(",", matches);
                return new DisproveInfo(p.getName(), candidatesCsv);
            }
        }
        return null;
    }

    // Helper class to hold disprove information
    private static class DisproveInfo {
        final String disproverName;
        final String candidateCards;

        DisproveInfo(String disproverName, String candidateCards) {
            this.disproverName = disproverName;
            this.candidateCards = candidateCards;
        }
    }
}
