package edu.jhu.clueless.engine;

import java.util.*;

/**
 * Simple in-memory lobby for a gameId. Tracks players and their selected characters.
 */
public class Lobby {
    private final String gameId;
    private final LinkedHashSet<String> players = new LinkedHashSet<>();
    private final Map<String, String> selections = new LinkedHashMap<>(); // playerId -> character
    private final Map<String, Boolean> ready = new LinkedHashMap<>(); // playerId -> ready
    private boolean started;

    public static final List<String> CHARACTERS = List.of(
            "GREEN", "MUSTARD", "PEACOCK", "PLUM", "SCARLET", "WHITE"
    );

    public Lobby(String gameId) { this.gameId = gameId; }

    public String getGameId() { return gameId; }
    public boolean isStarted() { return started; }
    public void setStarted(boolean started) { this.started = started; }
    public Set<String> getPlayers() { return Collections.unmodifiableSet(players); }
    public Map<String, String> getSelections() { return Collections.unmodifiableMap(selections); }
    public Map<String, Boolean> getReadyMap() { return Collections.unmodifiableMap(ready); }

    public void join(String playerId) {
        if (playerId != null && !playerId.isBlank()) {
            players.add(playerId);
            ready.putIfAbsent(playerId, false);
        }
    }

    public boolean selectCharacter(String playerId, String character) {
        if (playerId == null || character == null) return false;
        String up = character.trim().toUpperCase(Locale.ROOT);
        if (!CHARACTERS.contains(up)) return false;
        // character must be free (or already assigned to this player)
        if (isCharacterTakenByOther(playerId, up)) return false;
        players.add(playerId);
        selections.put(playerId, up);
        return true;
    }

    public String getSelectedCharacter(String playerId) { return selections.get(playerId); }

    public boolean unselectCharacter(String playerId) {
        if (playerId == null) return false;
        return selections.remove(playerId) != null;
    }

    public List<String> getAvailableCharacters() {
        List<String> avail = new ArrayList<>(CHARACTERS);
        avail.removeAll(selections.values());
        return avail;
    }

    public void setReady(String playerId, boolean isReady) {
        if (playerId == null) return;
        if (players.contains(playerId)) ready.put(playerId, isReady);
    }

    public boolean isReady(String playerId) {
        return Boolean.TRUE.equals(ready.get(playerId));
    }

    public boolean allReady() {
        if (players.isEmpty()) return false;
        for (String p : players) {
            if (!Boolean.TRUE.equals(ready.get(p))) return false;
        }
        return true;
    }

    public boolean allSelectedCharacters() {
        for (String p : players) {
            if (selections.get(p) == null) return false;
        }
        return !players.isEmpty();
    }

    private boolean isCharacterTakenByOther(String playerId, String character) {
        for (Map.Entry<String,String> e : selections.entrySet()) {
            if (!e.getKey().equals(playerId) && character.equalsIgnoreCase(e.getValue())) return true;
        }
        return false;
    }
}
