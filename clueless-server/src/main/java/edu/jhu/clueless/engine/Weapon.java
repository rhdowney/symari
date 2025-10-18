package edu.jhu.clueless.engine;

public class Weapon {
    private String name;
    private Room location; 

    public Weapon(String name){
        this.name = name;
    }

    public String getName() { return name; }
    public Room getLocation() { return location; }
    public void setLocation(Room location) { this.location = location; }
}
