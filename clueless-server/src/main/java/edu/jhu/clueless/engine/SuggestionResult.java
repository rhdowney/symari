package edu.jhu.clueless.engine;

public class SuggestionResult {
    private final boolean accepted; // true if rules allowed the suggestion
    private final String suggester;
    private final String suspect;
    private final String weapon;
    private final String room;
    private final String disprover; // null if none
    private final String revealedCard; // null if hidden or none

    public SuggestionResult(boolean accepted, String suggester, String suspect, String weapon, String room, String disprover, String revealedCard) {
        this.accepted = accepted;
        this.suggester = suggester;
        this.suspect = suspect;
        this.weapon = weapon;
        this.room = room;
        this.disprover = disprover;
        this.revealedCard = revealedCard;
    }

    public boolean isAccepted() { return accepted; }
    public String getSuggester() { return suggester; }
    public String getSuspect() { return suspect; }
    public String getWeapon() { return weapon; }
    public String getRoom() { return room; }
    public String getDisprover() { return disprover; }
    public String getRevealedCard() { return revealedCard; }
}
