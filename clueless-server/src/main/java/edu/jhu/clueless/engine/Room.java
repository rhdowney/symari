package edu.jhu.clueless.engine;

import java.util.ArrayList;
import java.util.List;

public class Room {
    private String name;
    private final List<Player> occupants = new ArrayList<>();
    private final List<Room> connectedRooms = new ArrayList<>();

    public Room(String name) {
        this.name = name;
    }

    public void connect(Room other) {
        if (other == null || other == this) return;
        if (!connectedRooms.contains(other)) connectedRooms.add(other);
        if (!other.connectedRooms.contains(this)) other.connectedRooms.add(this);
    }

    public String getName() {
        return name;
    }

    public List<Room> getConnectedRooms() {
        return connectedRooms;
    }

    public List<Player> getOccupants() {
        return occupants;
    }

    public void addOccupant(Player p) {
        if (p != null && !occupants.contains(p)) occupants.add(p);
    }

    public void removeOccupant(Player p) {
        occupants.remove(p);
    }
}
