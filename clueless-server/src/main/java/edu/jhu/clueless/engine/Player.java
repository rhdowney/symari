package edu.jhu.clueless.engine;

import java.util.List;

public class Player {
    private String name;
    private String characterName;
    private Room currentRoom; 
    private BoardLocation currentLocation;
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
    public void setCurrentRoom(Room room) { 
        this.currentRoom = room; 
        this.currentLocation = room;
    }
    public BoardLocation getLocation() { return currentLocation; }
    public void setLocation(BoardLocation loc) { 
        this.currentLocation = loc; 
        this.currentRoom = (loc instanceof Room) ? (Room) loc : null;
    }
    public boolean isActive() { return isActive; }
    public void deactivate() { this.isActive = false; }
    public boolean hasMovedThisTurn() { return movedThisTurn; }
    public void setMovedThisTurn(boolean v) { this.movedThisTurn = v; }
    public boolean hasSuggestedThisTurn() { return suggestedThisTurn; }
    public void setSuggestedThisTurn(boolean v) { this.suggestedThisTurn = v; }
    public void resetTurnFlags() { this.movedThisTurn = false; this.suggestedThisTurn = false; }

    // Hand management
    public List<Card> getHand() { return hand; }
    public void clearHand() { if (hand != null) hand.clear(); }
    public void addCard(Card c) { if (c == null) return; if (hand == null) throw new IllegalStateException("Hand not initialized"); hand.add(c); }
    public void initEmptyHand() { if (hand == null) hand = new java.util.ArrayList<>(); else hand.clear(); }
}
