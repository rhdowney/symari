package edu.jhu.clueless.engine;

public class MoveHandler {

    private final GameState gameState;

    public MoveHandler(GameState gameState){
        this.gameState = gameState;
    }

    public boolean handleMove(String playerName, String targetRoomName){
        Player player = gameState.getPlayer(playerName);
        Room targetRoom = gameState.getRoom(targetRoomName);

        if (player == null || targetRoom == null) return false;

        // First placement: allow placing the player without rule checks
        if (player.getCurrentRoom() == null) {
            player.setCurrentRoom(targetRoom);
            targetRoom.addOccupant(player);
            System.out.println("[MOVE] " + player.getName() + " placed in " + targetRoom.getName());
            return true;
        }

        // Subsequent moves follow rules
        if (!RuleValidator.canMove(player, targetRoom)) return false;

        Room currentRoom = player.getCurrentRoom();
        if (currentRoom != null) currentRoom.removeOccupant(player);

        player.setCurrentRoom(targetRoom);
        targetRoom.addOccupant(player);

        System.out.println("[MOVE] " + player.getName() + " moved to " + targetRoom.getName());
        return true;
    }
}
