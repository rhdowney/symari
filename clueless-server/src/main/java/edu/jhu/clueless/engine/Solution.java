package edu.jhu.clueless.engine;

public class Solution {
    private final String suspect;
    private final String weapon;
    private final String room;

    public Solution(String suspect, String weapon, String room) {
        this.suspect = suspect;
        this.weapon = weapon;
        this.room = room;
    }

    public String getSuspect() { return suspect; }
    public String getWeapon() { return weapon; }
    public String getRoom() { return room; }
}