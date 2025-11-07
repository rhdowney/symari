package edu.jhu.clueless.engine;

public class Suggestion {
	private final String suggester;
	private final String suspect;
	private final String weapon;
	private final String room;

	public Suggestion(String suggester, String suspect, String weapon, String room) {
		this.suggester = suggester;
		this.suspect = suspect;
		this.weapon = weapon;
		this.room = room;
	}

	public String getSuggester() { return suggester; }
	public String getSuspect() { return suspect; }
	public String getWeapon() { return weapon; }
	public String getRoom() { return room; }
}
