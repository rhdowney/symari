package edu.jhu.clueless.engine;

/** Marker interface for locations on the board (rooms and hallways). */
public interface BoardLocation {
    String getName();
    default boolean isRoom() { return this instanceof Room; }
}
