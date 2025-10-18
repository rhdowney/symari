package edu.jhu.clueless.engine;

import java.util.ArrayList;
import java.util.List;

public class Room {
    private String name;
    private List<Room> connectedRooms;
    private Weapon weapon;
    private List<Player> occupants;
    
    public Room(String name){
        this.name = name;
        this.connectedRooms = new ArrayList<>();
        this.occupants = new ArrayList<>();
    }

    public void connect(Room other){
        connectedRooms.add(other);
    }

    public String getName() { return name; }
    public List<Room> getConnectedRooms() { return connectedRooms; }
    public List<Player> getOccupants() { return occupants; }
    public Weapon getWeapon() { return weapon; }

    public void addOccupant(Player player) { occupants.add(player); }
    public void removeOccupant(Player player) { occupants.remove(player); }


}
