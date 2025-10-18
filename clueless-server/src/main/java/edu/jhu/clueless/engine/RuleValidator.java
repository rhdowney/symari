package edu.jhu.clueless.engine;

public class RuleValidator {
    
    // Check if a player can move to the requested room
    public static boolean canMove(Player player, Room targetRoom){
        if(player.getCurrentRoom() == null) return false;
        return player.getCurrentRoom().getConnectedRooms().contains(targetRoom); 
    }

    // Check if a player can make a suggestion - must be in a room

    public static boolean canSuggest(Player player){ 
        return player.getCurrentRoom() != null; 
    }

    // Check if accusation format is valid - simple stub for now

    public static boolean isValidAccusation(String suspect, String weapon, String room) {
        return suspect != null && weapon != null && room != null;
    } 

}
