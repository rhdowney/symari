package edu.jhu.clueless.engine;

public class MoveHandler {

    private final GameState gameState;
    private final Board board;

    public MoveHandler(GameState gameState){
        this(gameState, null);
    }

    public MoveHandler(GameState gameState, Board board){
        this.gameState = gameState;
        this.board = board;
    }

    public boolean handleMove(String playerName, String targetRoomName){
        Player player = gameState.getPlayer(playerName);
        Room targetRoom = gameState.getRoom(targetRoomName);

        if (player == null || targetRoom == null) return false;

        // If currently in a hallway, allow exiting into an adjacent room using the legacy API
        if (player.getCurrentRoom() == null && player.getLocation() instanceof Board.Hallway h && board != null) {
            if (h.other(targetRoom) != null) {
                // leave hallway into room
                h.vacate();
                player.setCurrentRoom(targetRoom);
                targetRoom.addOccupant(player);
                System.out.println("[MOVE] " + player.getName() + " exited hallway " + h.getName() + " into " + targetRoom.getName());
                return true;
            } else {
                return false;
            }
        }

        // First placement into a room: allow placing the player without rule checks
        if (player.getCurrentRoom() == null) {
            player.setCurrentRoom(targetRoom);
            targetRoom.addOccupant(player);
            System.out.println("[MOVE] " + player.getName() + " placed in " + targetRoom.getName());
            return true;
        }

        // If a board is available, use board-defined adjacency
        if (board != null) {
            Room currentRoom = player.getCurrentRoom();
            if (currentRoom == null) return false; // should have been handled above
            if (!board.areAdjacent(currentRoom, targetRoom)) return false;
            // If adjacency is via hallway, enforce single-occupancy hallway as a blocker for atomic room->room moves
            Board.Hallway h = board.getHallwayBetween(currentRoom, targetRoom);
            if (h != null && h.isOccupied() && h.getOccupant() != player) {
                return false;
            }
        } else {
            // Fallback to legacy validation
            if (!RuleValidator.canMove(player, targetRoom, board)) return false;
        }

        Room currentRoom = player.getCurrentRoom();
        if (currentRoom != null) currentRoom.removeOccupant(player);

        player.setCurrentRoom(targetRoom);
        targetRoom.addOccupant(player);

        System.out.println("[MOVE] " + player.getName() + " moved to " + targetRoom.getName());
        return true;
    }

    // New: move the player into a hallway adjacent to their current room
    public boolean handleMoveToHallway(String playerName, String hallwayId) {
        if (board == null) return false; // requires board topology
        Player player = gameState.getPlayer(playerName);
        if (player == null) return false;

        Board.Hallway h = board.getHallwayById(hallwayId);
        if (h == null) return false;

        // Must start in one of the hallway's rooms and be currently in a room
        Room currentRoom = player.getCurrentRoom();
        if (currentRoom == null) return false;
        Room other = h.other(currentRoom);
        if (other == null) return false; // not adjacent to this hallway

        if (h.isOccupied() && h.getOccupant() != player) return false;

        // leave current room
        currentRoom.removeOccupant(player);
        // occupy hallway
        h.occupy(player);
        player.setLocation(h);
        System.out.println("[MOVE] " + player.getName() + " entered hallway " + h.getName());
        return true;
    }

    // New: move the player from their current hallway into the specified adjacent room
    public boolean handleMoveFromHallwayToRoom(String playerName, String targetRoomName) {
        if (board == null) return false;
        Player player = gameState.getPlayer(playerName);
        if (player == null) return false;
        if (!(player.getLocation() instanceof Board.Hallway h)) return false;
        Room targetRoom = gameState.getRoom(targetRoomName);
        if (targetRoom == null) return false;

        // hallway must connect to target room
        if (h.other(targetRoom) == null) return false;

        // vacate hallway and enter room
        h.vacate();
        player.setCurrentRoom(targetRoom);
        targetRoom.addOccupant(player);
        System.out.println("[MOVE] " + player.getName() + " exited hallway " + h.getName() + " into " + targetRoom.getName());
        return true;
    }
}
