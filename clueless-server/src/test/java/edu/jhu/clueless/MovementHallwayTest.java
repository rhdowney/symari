package edu.jhu.clueless;

import edu.jhu.clueless.engine.*;
import org.junit.Test;
import static org.junit.Assert.*;

public class MovementHallwayTest {

    @Test
    public void hallwayBlocksAtomicRoomToRoomMove() {
        GameEngine engine = new GameEngine(new GameState());
        Board board = Board.standard();

        // Place two players in adjacent rooms (HALL and LOUNGE)
        engine.joinPlayer("A", "GREEN");
        engine.joinPlayer("B", "SCARLET");

        assertTrue(engine.handleMove("A", "HALL"));
        assertTrue(engine.handleMove("B", "LOUNGE"));

        // A enters the hallway between HALL and LOUNGE
        assertTrue(engine.handleMoveToHallway("A", "HALL_LOUNGE"));

        // B attempts to move from LOUNGE to HALL (atomic). Should be blocked by occupied hallway
        assertFalse(engine.handleMove("B", "HALL"));

        // A exits hallway into LOUNGE
        assertTrue(engine.handleMoveFromHallwayToRoom("A", "LOUNGE"));

        // Now B can move to HALL
        assertTrue(engine.handleMove("B", "HALL"));
    }

    @Test
    public void canExitHallwayViaLegacyAPI() {
        GameEngine engine = new GameEngine(new GameState());
        engine.joinPlayer("A", "GREEN");
        assertTrue(engine.handleMove("A", "HALL"));

        // Enter hallway
        assertTrue(engine.handleMoveToHallway("A", "HALL_STUDY"));
        // Exit into STUDY using legacy room move API
        assertTrue(engine.handleMove("A", "STUDY"));
    }
}
