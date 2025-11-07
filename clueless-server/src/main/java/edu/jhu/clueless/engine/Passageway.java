package edu.jhu.clueless.engine;

import java.util.Objects;

/**
 * Represents a passage between two rooms. Used for secret (diagonal) passages
 * on the Clue board but can represent any special room-to-room connection.
 */
public class Passageway {
	private final Room from;
	private final Room to;
	private final boolean secret;

	public Passageway(Room from, Room to, boolean secret) {
		this.from = Objects.requireNonNull(from);
		this.to = Objects.requireNonNull(to);
		this.secret = secret;
	}

	public Room getFrom() { return from; }
	public Room getTo() { return to; }
	public boolean isSecret() { return secret; }

	public Room other(Room r) { return r == from ? to : r == to ? from : null; }
}
