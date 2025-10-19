package edu.jhu.clueless.engine;

public class RuleValidator {

    // True if targetRoom is adjacent to player's current room.
    // For first placement (no current room), allow move.
    public static boolean canMove(Player player, Room targetRoom) {
        if (player == null || targetRoom == null) return false;
        Room current = player.getCurrentRoom();
        if (current == null) return true; // initial placement handled by engine/router
        return current.getConnectedRooms().contains(targetRoom);
    }

    // Player must be in a room to suggest
    public static boolean canSuggest(Player player) {
        return player != null && player.getCurrentRoom() != null;
    }

    // Simple format check for accusation fields
    public static boolean isValidAccusation(String suspect, String weapon, String room) {
        return notBlank(suspect) && notBlank(weapon) && notBlank(room);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }
}
