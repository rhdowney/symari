package edu.jhu.clueless.engine;

import java.util.List;

public class Player {
    private String name;
    private String characterName;
    private Room currentRoom; 
    private List<Card> hand;
    private boolean isActive;
    private boolean movedThisTurn;
    private boolean suggestedThisTurn;

    public Player(String name, String characterName) {
        this.name = name;
        this.characterName = characterName;
        this.isActive = true;
    }

    // Getters and Setters
    public String getName() { return name; }
    public String getCharacterName() { return characterName; }
    public Room getCurrentRoom() { return currentRoom; }
    public void setCurrentRoom(Room room) { this.currentRoom = room; }
    public boolean isActive() { return isActive; }
    public void deactivate() { this.isActive = false; }
    public boolean hasMovedThisTurn() { return movedThisTurn; }
    public void setMovedThisTurn(boolean v) { this.movedThisTurn = v; }
    public boolean hasSuggestedThisTurn() { return suggestedThisTurn; }
    public void setSuggestedThisTurn(boolean v) { this.suggestedThisTurn = v; }
    public void resetTurnFlags() { this.movedThisTurn = false; this.suggestedThisTurn = false; }
}
