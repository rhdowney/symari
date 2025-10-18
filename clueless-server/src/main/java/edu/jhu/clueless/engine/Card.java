package edu.jhu.clueless.engine;

public class Card {
    public enum Type { CHARACTER, WEAPON, ROOM }

    private String name;
    private Type type; 

    public Card(String name, Type type) {
        this.name = name;
        this.type = type;
    }

    public String getName() { return name; }
    public Type getType() { return type; }
}
