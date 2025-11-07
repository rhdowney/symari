package edu.jhu.clueless.engine;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class SuggestionHandler {

    private final GameState gameState;

    public SuggestionHandler(GameState gameState){
        this.gameState = gameState;
    }

    public SuggestionResult handleSuggestion(String playerName, String suspect, String weapon, String room){
        Player player = gameState.getPlayer(playerName);

        if (player == null) {
            return new SuggestionResult(false, playerName, suspect, weapon, room, null, null);
        }

        if(!RuleValidator.canSuggest(player)){
            System.out.println("[SUGGEST] Invalid suggestion - player not in a room");
            return new SuggestionResult(false, playerName, suspect, weapon, room, null, null);
        }

        Room current = player.getCurrentRoom();
        if (current == null || room == null || !current.getName().equalsIgnoreCase(room)) {
            System.out.println("[SUGGEST] Invalid suggestion - must be from your current room");
            return new SuggestionResult(false, playerName, suspect, weapon, room, null, null);
        }

        System.out.println("[SUGGEST] " + player.getName() + " suggests it was " + suspect + " with the " + weapon + " in the " + room);

        // 1) Move the suggested suspect's token to the room (if a player is playing that character)
        Player suspectPlayer = findPlayerByCharacter(suspect);
        if (suspectPlayer != null) {
            movePlayerToRoom(suspectPlayer, current);
        }

        // 2) Attempt to resolve disproof by scanning other players' hands (if implemented). Currently, no dealing logic exists,
        //    so we return no-disprover.
        String disprover = null;
        String revealedCard = null;

        // Attempt to disprove by scanning players in turn order starting after suggester
        for (Player cand : playersInTurnOrderStartingAfter(player)) {
            List<Card> matches = matchingCards(cand, suspect, weapon, room);
            if (!matches.isEmpty()) {
                Card chosen = matches.get(0); // simple policy: first matching card
                disprover = cand.getName();
                revealedCard = chosen.getName();
                break;
            }
        }

        return new SuggestionResult(true, playerName, suspect, weapon, room, disprover, revealedCard);
    }

    private Player findPlayerByCharacter(String characterName) {
        if (characterName == null) return null;
        String target = characterName.trim().toLowerCase(Locale.ROOT);
        for (Player p : gameState.getPlayers().values()) {
            if (p.getCharacterName() != null && p.getCharacterName().trim().toLowerCase(Locale.ROOT).equals(target)) {
                return p;
            }
        }
        return null;
    }

    private void movePlayerToRoom(Player p, Room targetRoom) {
        // If player is currently in a hallway, vacate it
        if (p.getLocation() instanceof Board.Hallway h) {
            if (h.getOccupant() == p) h.vacate();
        }
        Room cur = p.getCurrentRoom();
        if (cur != null && cur != targetRoom) {
            cur.removeOccupant(p);
        }
        if (cur == targetRoom) return;
        p.setCurrentRoom(targetRoom);
        targetRoom.addOccupant(p);
    }

    private List<Card> matchingCards(Player p, String suspect, String weapon, String room) {
        List<Card> res = new ArrayList<>();
        if (p == null || p.getHand() == null) return res;
        for (Card c : p.getHand()) {
            if (c == null) continue;
            switch (c.getType()) {
                case CHARACTER -> { if (suspect != null && c.getName().equalsIgnoreCase(suspect)) res.add(c); }
                case WEAPON -> { if (weapon != null && c.getName().equalsIgnoreCase(weapon)) res.add(c); }
                case ROOM -> { if (room != null && c.getName().equalsIgnoreCase(room)) res.add(c); }
            }
        }
        return res;
    }

    private List<Player> playersInTurnOrderStartingAfter(Player start) {
        List<Player> all = new ArrayList<>(gameState.getPlayers().values());
        List<Player> order = new ArrayList<>();
        if (all.isEmpty() || start == null) return order;
        int idx = all.indexOf(start);
        int n = all.size();
        for (int i = 1; i < n; i++) {
            Player p = all.get((idx + i) % n);
            if (p != null && p.isActive()) order.add(p);
        }
        return order;
    }
}
