package edu.jhu.clueless.engine;

import java.util.*;

/**
 * Board is the authoritative model of the Clue/Cluedo board layout.
 * It owns the immutable set of Rooms, the Hallways (door-to-door corridors),
 * and the Secret Passages between corner rooms.
 *
 * Compatibility note: for now, Board also wires up direct Room-to-Room
 * connections to match the current RuleValidator which checks adjacency via
 * Room.getConnectedRooms(). This allows incremental refactoring: the engine can
 * begin using Board immediately without changing Player/RuleValidator. Later,
 * movement rules can evolve to traverse Hallways explicitly and enforce
 * hallway occupancy limits.
 */
public class Board {

    /** Simple representation of a hallway between two rooms. */
    public static final class Hallway implements BoardLocation {
        private final String id; // e.g. HALL_LOUNGE
        private final Room a;
        private final Room b;
        private Player occupant; // single-occupancy hallway

        public Hallway(String id, Room a, Room b) {
            this.id = Objects.requireNonNull(id);
            this.a = Objects.requireNonNull(a);
            this.b = Objects.requireNonNull(b);
        }

        public String getId() { return id; }
        @Override public String getName() { return id; }
        public Room getA() { return a; }
        public Room getB() { return b; }

        public Room other(Room r) { return r == a ? b : r == b ? a : null; }

        public boolean isOccupied() { return occupant != null; }
        public Player getOccupant() { return occupant; }
        public void occupy(Player p) { this.occupant = p; }
        public void vacate() { this.occupant = null; }
    }

    private final Map<String, Room> rooms = new LinkedHashMap<>();
    private final Map<String, Hallway> hallways = new LinkedHashMap<>();
    private final List<Passageway> secretPassages = new ArrayList<>();

    public Map<String, Room> getRooms() { return Collections.unmodifiableMap(rooms); }
    public Map<String, Hallway> getHallways() { return Collections.unmodifiableMap(hallways); }
    public List<Passageway> getSecretPassages() { return Collections.unmodifiableList(secretPassages); }
    public Hallway getHallwayById(String id) { return hallways.get(id); }

    /** Build and return the standard Clue board definition. */
    public static Board standard() {
        Board b = new Board();
        b.initStandard();
        return b;
    }

    /** Idempotently apply this board to the provided game state. */
    public void applyTo(GameState state) {
        // Add Rooms into GameState if absent. We add the exact instances held by Board
        // so that any pre-wired room connections are preserved.
        for (Room r : rooms.values()) {
            if (state.getRoom(r.getName()) == null) {
                state.addRoom(r);
            }
        }
    }

    // --- internals ---

    private void initStandard() {
        // Rooms (canonical names)
        Room HALL = room("HALL");
        Room LOUNGE = room("LOUNGE");
        Room STUDY = room("STUDY");
        Room LIBRARY = room("LIBRARY");
        Room BILLIARD = room("BILLIARD");
        Room CONSERVATORY = room("CONSERVATORY");
        Room BALLROOM = room("BALLROOM");
        Room KITCHEN = room("KITCHEN");
        Room DINING = room("DINING");

        // Hallways (orthogonal adjacencies)
        hallway(HALL, LOUNGE);
        hallway(HALL, STUDY);
        hallway(LOUNGE, DINING);
        hallway(LIBRARY, BILLIARD);
        hallway(BILLIARD, CONSERVATORY);
        hallway(BILLIARD, DINING);
        hallway(CONSERVATORY, BALLROOM);
        hallway(BALLROOM, KITCHEN);
        hallway(KITCHEN, DINING);

        // Secret passages (diagonal corners)
        secret(LOUNGE, CONSERVATORY);
        secret(STUDY, KITCHEN);
    }

    private Room room(String name) {
        return rooms.computeIfAbsent(name, Room::new);
    }

    private void hallway(Room a, Room b) {
        String idAB = a.getName() + "_" + b.getName();
        String idBA = b.getName() + "_" + a.getName();
        String canonical = a.getName().compareTo(b.getName()) <= 0 ? idAB : idBA;
        Hallway h = hallways.get(canonical);
        if (h == null) {
            h = new Hallway(canonical, a, b);
            hallways.put(canonical, h);
        }
        // map both oriented ids to the same hallway instance
        hallways.put(idAB, h);
        hallways.put(idBA, h);
        // Adjacency is represented by hallways within Board
    }

    private void secret(Room a, Room b) {
        // Store an explicit passageway for movement rules
        Passageway p = new Passageway(a, b, true);
        secretPassages.add(p);
        // Adjacency via secret passage is represented in Board helpers
    }

    // --- helpers for movement and topology ---

    public Hallway getHallwayBetween(Room a, Room b) {
        if (a == null || b == null) return null;
        Hallway h = hallways.get(a.getName() + "_" + b.getName());
        if (h != null) return h;
        return hallways.get(b.getName() + "_" + a.getName());
    }

    public boolean areAdjacent(Room a, Room b) {
        return getHallwayBetween(a, b) != null || hasSecret(a, b);
    }

    public List<Room> adjacentRooms(Room r) {
        List<Room> res = new ArrayList<>();
        for (Hallway h : hallways.values()) {
            if (h.getA() == r) res.add(h.getB());
            else if (h.getB() == r) res.add(h.getA());
        }
        // include secret passage neighbor if any
        for (Passageway p : secretPassages) {
            if (p.getFrom() == r) res.add(p.getTo());
            else if (p.getTo() == r) res.add(p.getFrom());
        }
        return res;
    }

    public boolean hasSecret(Room a, Room b) {
        for (Passageway p : secretPassages) {
            if ((p.getFrom() == a && p.getTo() == b) || (p.getFrom() == b && p.getTo() == a)) return true;
        }
        return false;
    }
}
