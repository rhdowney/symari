package edu.jhu.clueless;

import edu.jhu.clueless.engine.*;
import org.junit.Test;

import static org.junit.Assert.*;

public class BoardTopologyTest {

    @Test
    public void standardBoardHasRoomsAndPassages() {
        Board board = Board.standard();
        assertEquals(9, board.getRooms().size());
        // Two secret passages: Lounge<->Conservatory and Study<->Kitchen
        assertEquals(2, board.getSecretPassages().size());

        Room hall = board.getRooms().get("HALL");
        Room lounge = board.getRooms().get("LOUNGE");
        Room study = board.getRooms().get("STUDY");
        Room kitchen = board.getRooms().get("KITCHEN");
        Room dining = board.getRooms().get("DINING");

        assertNotNull(hall);
        assertNotNull(lounge);
        assertTrue(board.areAdjacent(hall, lounge));
        assertTrue(board.areAdjacent(study, kitchen)); // secret passage
        assertTrue(board.areAdjacent(kitchen, dining));
        assertFalse(board.areAdjacent(hall, kitchen)); // not adjacent directly

        Board.Hallway hl = board.getHallwayBetween(hall, lounge);
        assertNotNull(hl);
        assertFalse(hl.isOccupied());
    }

    @Test
    public void applyToGameStateIsIdempotent() {
        Board board = Board.standard();
        GameState state = new GameState();
        board.applyTo(state);
        board.applyTo(state);
        assertEquals(9, state.getRooms().size());
        // Verify adjacency using Board API
        Room hall = state.getRoom("HALL");
        Room lounge = state.getRoom("LOUNGE");
        assertTrue(board.areAdjacent(hall, lounge));
    }
}
