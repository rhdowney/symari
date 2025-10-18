package edu.jhu.clueless.engine;

import java.util.List;

public class Player {
    private String name;
    private String characterName;
    private Room currentRoom;(
    private List<Card> hand;
    private boolean isActive;

    public Player(String name, String characterName) {
        this.name = name;
        this.characterName = characterName;
        this.isActive = true;
    }

    // Getters and Setters
    public String getName() { return name; }
    public String getCharacterName() { reutrn characterName; }
    public Room getCurrentRoom() { return currentRoom; }
    public void setCurrentRoom(Room room) { this.currentRoom = room; }
    public boolean isActive() { return isActive; }
    public void deactivate() { this.isActive = false; }
}
