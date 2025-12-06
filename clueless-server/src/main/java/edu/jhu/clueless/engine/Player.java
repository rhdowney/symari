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
    // Track how the player entered their current room (self vs suggestion). If not in a room, NONE.
    public enum RoomEntryType { NONE, SELF, SUGGESTION }
    private RoomEntryType roomEntryType = RoomEntryType.NONE;

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
        // When directly setting a room via engine logic, keep existing entry type unless cleared elsewhere
        if (room == null) {
            this.roomEntryType = RoomEntryType.NONE;
        }
    }
    public BoardLocation getLocation() { return currentLocation; }
    public void setLocation(BoardLocation loc) { 
        this.currentLocation = loc; 
        this.currentRoom = (loc instanceof Room) ? (Room) loc : null;
        if (!(loc instanceof Room)) {
            this.roomEntryType = RoomEntryType.NONE; // leaving room resets entry type
        }
    }
    public boolean isActive() { return isActive; }
    public void deactivate() { this.isActive = false; }
    public boolean hasMovedThisTurn() { return movedThisTurn; }
    public void setMovedThisTurn(boolean v) { this.movedThisTurn = v; }
    public boolean hasSuggestedThisTurn() { return suggestedThisTurn; }
    public void setSuggestedThisTurn(boolean v) { this.suggestedThisTurn = v; }
    public void resetTurnFlags() { this.movedThisTurn = false; this.suggestedThisTurn = false; }

    // Room entry tracking helpers
    public RoomEntryType getRoomEntryType() { return roomEntryType; }
    public void setEnteredRoomBySelf() { this.roomEntryType = RoomEntryType.SELF; }
    public void setEnteredRoomBySuggestion() { this.roomEntryType = RoomEntryType.SUGGESTION; }
    public void clearRoomEntryType() { this.roomEntryType = RoomEntryType.NONE; }
    /**
     * Must move out rule: If currently in a room and entry type was SELF, the player must exit the room
     * at the start of their turn before performing other actions (e.g., suggesting).
     */
    public boolean mustExitRoomBeforeActions() {
        return this.currentRoom != null && this.roomEntryType == RoomEntryType.SELF;
    }

    // Hand management
    public List<Card> getHand() { return hand; }
    public void clearHand() { if (hand != null) hand.clear(); }
    public void addCard(Card c) { if (c == null) return; if (hand == null) throw new IllegalStateException("Hand not initialized"); hand.add(c); }
    public void initEmptyHand() { if (hand == null) hand = new java.util.ArrayList<>(); else hand.clear(); }
}
