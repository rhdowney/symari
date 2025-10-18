package edu.jhu.clueless.engine;

public class MoveHandler {
    
    private GameState gameState; 

    public MoveHandler(GameState gameState){
        this.gameState = gameState; 
    }

    public boolean handleMove(String playerName, String targetRoomName){
        Player player = gameState.getPlayer(playerName);
        Room targetRoom = gameState.getRoom(targetRoomName);

        if(player == null || targetRoom == null) return false;
        if(!RuleValidator.canMove(player, targetRoom)) return false;

        // Update state

        Room current = player.getCurrentRoom();
        if (current != null) current.removeOccupant(player);

        player.setCurrentRoom(targetRoom);
        targetRoom.addOccupant(player);

        System.out.println("[MOVE] " + player.getName() + " moved to " + targetRoom.getname());
        return true;
    }
}
