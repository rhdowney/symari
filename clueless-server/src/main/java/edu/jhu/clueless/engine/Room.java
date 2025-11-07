package edu.jhu.clueless.engine;

import java.util.ArrayList;
import java.util.List;

public class Room implements BoardLocation {
    private String name;
    private final List<Player> occupants = new ArrayList<>();

    public Room(String name) {
        this.name = name;
    }

    // Adjacency is now modeled in Board; Room no longer maintains direct connections.

    public String getName() {
        return name;
    }

    // Deprecated: direct room connections have been removed.

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
