package edu.jhu.clueless.engine;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class GameState {
    private Map<String, Player> players = new LinkedHashMap<>();
    private Map<String, Room> rooms = new LinkedHashMap<>();
    private List<Weapon> weapons = new ArrayList<>();
    private Player currentPlayer;
    private Solution solution;
    private boolean gameOver;
    private String winner;

    // Add: canonical set of suspects (all 6) and their positions (room/hallway or null)
    private static final List<String> ALL_SUSPECTS = List.of(
        "GREEN","PEACOCK","PLUM","SCARLET","MUSTARD","WHITE"
    );

    private final Map<String,String> suspectPositions = new HashMap<>();

    public GameState() {
        // initialize suspect positions to null (not placed) or initial setup
        for (String s : ALL_SUSPECTS) suspectPositions.put(s, null);
    }

    // Accessors and helpers
    public Map<String, Player> getPlayers() { return players; }
    public Map<String, Room> getRooms() { return rooms; }

    public Player getPlayer(String name) { return name == null ? null : players.get(name); }
    public Room getRoom(String name) { return name == null ? null : rooms.get(name); }

    public void addPlayer(Player p) { if (p != null) players.put(p.getName(), p); }
    public void addRoom(Room r) { if (r != null) rooms.put(r.getName(), r); }

    public Player getCurrentPlayer() { return currentPlayer; }
    public void setCurrentPlayer(Player p) { this.currentPlayer = p; }

    public Solution getSolution() { return solution; }
    public void setSolution(Solution solution) { this.solution = solution; }
    public boolean isGameOver() { return gameOver; }
    public void setGameOver(boolean gameOver) { this.gameOver = gameOver; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }

    // New accessors
    public List<String> getAllSuspects() {
        return Collections.unmodifiableList(ALL_SUSPECTS);
    }

    public String getSuspectPosition(String suspect) {
        if (suspect == null) return null;
        return suspectPositions.get(suspect.toUpperCase());
    }

    public void setSuspectPosition(String suspect, String roomOrHallway) {
        if (suspect == null) return;
        suspectPositions.put(suspect.toUpperCase(), roomOrHallway);
    }

    // Optional helper used by UI/state snapshot builder
    public Map<String, String> getSuspectPositions() {
        return Collections.unmodifiableMap(suspectPositions);
    }

    // Advance turn to next active player (in insertion order)
    public Player nextTurn() {
        if (players.isEmpty()) { currentPlayer = null; return null; }
        List<Player> order = new ArrayList<>(players.values());
        if (currentPlayer == null) {
            currentPlayer = firstActive(order);
            return currentPlayer;
        }
        int i = order.indexOf(currentPlayer);
        for (int step = 1; step <= order.size(); step++) {
            Player cand = order.get((i + step) % order.size());
            if (cand != null && cand.isActive()) {
                currentPlayer = cand;
                return currentPlayer;
            }
        }
        // If none active, keep current as-is
        return currentPlayer;
    }

    private Player firstActive(List<Player> ps) {
        for (Player p : ps) if (p != null && p.isActive()) return p;
        return null;
    }
}
