package edu.jhu.clueless.engine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public class GameManager {

	public static class DealResult {
		public final Solution solution;
		public DealResult(Solution solution) { this.solution = solution; }
	}

	/**
	 * Initialize solution and deal remaining cards round-robin to all players.
	 * Idempotent best-effort: will re-initialize hands and overwrite previous solution.
	 */
	public static DealResult setupAndDeal(GameState state, Board board) {
		return setupAndDeal(state, board, new Random());
	}

	// Starting hallway assignments for each character
	private static final java.util.Map<String, String> STARTING_HALLWAYS = java.util.Map.of(
		"SCARLET", "HALL_LOUNGE",
		"MUSTARD", "DINING_LOUNGE",
		"WHITE", "BALLROOM_KITCHEN",
		"GREEN", "BALLROOM_CONSERVATORY",
		"PEACOCK", "CONSERVATORY_LIBRARY",
		"PLUM", "LIBRARY_STUDY"
	);

	public static DealResult setupAndDeal(GameState state, Board board, Random rng) {
		if (state == null) throw new IllegalArgumentException("state");
		if (board == null) throw new IllegalArgumentException("board");
		if (rng == null) rng = new Random();

		// 1) Build card pools
		List<String> suspects = new ArrayList<>();
		Collections.addAll(suspects, "GREEN", "MUSTARD", "PEACOCK", "PLUM", "SCARLET", "WHITE");

		List<String> weapons = new ArrayList<>();
		Collections.addAll(weapons, "CANDLESTICK", "DAGGER", "LEAD_PIPE", "REVOLVER", "ROPE", "WRENCH");

		List<String> rooms = new ArrayList<>(board.getRooms().keySet());

		// 2) Randomly choose one of each for the hidden solution
		String solSuspect = suspects.get(rng.nextInt(suspects.size()));
		String solWeapon = weapons.get(rng.nextInt(weapons.size()));
		String solRoom = rooms.get(rng.nextInt(rooms.size()));
		Solution solution = new Solution(solSuspect, solWeapon, solRoom);
		state.setSolution(solution);

		// 3) Build the deck from remaining cards
		List<Card> deck = new ArrayList<>();
		for (String s : suspects) if (!s.equals(solSuspect)) deck.add(new Card(s, Card.Type.CHARACTER));
		for (String w : weapons) if (!w.equals(solWeapon)) deck.add(new Card(w, Card.Type.WEAPON));
		for (String r : rooms) if (!r.equals(solRoom)) deck.add(new Card(r, Card.Type.ROOM));
		Collections.shuffle(deck, rng);

		// 4) Initialize player hands and deal round-robin
		List<Player> players = new ArrayList<>(state.getPlayers().values());
		for (Player p : players) p.initEmptyHand();
		if (!players.isEmpty()) {
			int i = 0;
			for (Card c : deck) {
				players.get(i % players.size()).addCard(c);
				i++;
			}
		}

		// 5) Place players in their starting hallways
		for (Player p : players) {
			String characterName = p.getCharacterName();
			String startingHallwayId = STARTING_HALLWAYS.get(characterName);
			if (startingHallwayId != null) {
				Board.Hallway hallway = board.getHallwayById(startingHallwayId);
				if (hallway != null) {
					hallway.occupy(p);
					p.setLocation(hallway);
					System.out.println("[SETUP] " + p.getName() + " (" + characterName + ") placed in starting hallway " + startingHallwayId);
				}
			}
		}

		return new DealResult(solution);
	}
}
