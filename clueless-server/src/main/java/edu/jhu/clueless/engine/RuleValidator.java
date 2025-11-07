package edu.jhu.clueless.engine;

public class RuleValidator {

    // True if targetRoom is adjacent to player's current room per Board topology.
    // For first placement (no current room), allow move.
    public static boolean canMove(Player player, Room targetRoom, Board board) {
        if (player == null || targetRoom == null) return false;
        Room current = player.getCurrentRoom();
        if (current == null) return true; // initial placement handled by engine/router
        if (board == null) return false;
        return board.areAdjacent(current, targetRoom);
    }

    // Player must be in a room to suggest
    public static boolean canSuggest(Player player) {
        return player != null && player.getCurrentRoom() != null;
    }

    // Player must be in a room and the provided room name must match the current room.
    public static boolean canSuggestInCurrentRoom(Player player, String roomName) {
        if (player == null || roomName == null) return false;
        Room cur = player.getCurrentRoom();
        return cur != null && cur.getName() != null && cur.getName().equalsIgnoreCase(roomName);
    }

    // Simple format check for accusation fields
    public static boolean isValidAccusation(String suspect, String weapon, String room) {
        return notBlank(suspect) && notBlank(weapon) && notBlank(room);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }

    // True if a player can step from their current room into the given hallway.
    // Requires: player is in a room that borders the hallway and the hallway is unoccupied.
    public static boolean canMoveToHallway(Player player, Board.Hallway hallway, Board board) {
        if (player == null || hallway == null || board == null) return false;
        // Must currently be in a room (not already in a hallway)
        if (player.getLocation() instanceof Board.Hallway) return false;
        Room cur = player.getCurrentRoom();
        if (cur == null) return false;
        // Hallway must connect to the current room
        boolean borders = hallway.getA() == cur || hallway.getB() == cur;
        if (!borders) return false;
        // Single-occupancy hallway must be free
        return !hallway.isOccupied();
    }

    // True if a player can step from their current hallway into the given target room.
    // Requires: player is in a hallway and the target room is one of the hallway endpoints.
    public static boolean canMoveFromHallway(Player player, Room targetRoom, Board board) {
        if (player == null || targetRoom == null || board == null) return false;
        if (!(player.getLocation() instanceof Board.Hallway hallway)) return false;
        // Player should be the occupant of the hallway to move out
        if (hallway.getOccupant() != player) return false;
        return hallway.getA() == targetRoom || hallway.getB() == targetRoom;
    }
}
