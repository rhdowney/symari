package edu.jhu.clueless;

import edu.jhu.clueless.engine.*;
import org.junit.Test;
import static org.junit.Assert.*;

public class SuggestionMovementTest {

    @Test
    public void suspectIsMovedToSuggestingRoom() {
        GameEngine engine = new GameEngine(new GameState());
        // Join two players; assign character names to match suspects
        engine.joinPlayer("p1", "GREEN");
        engine.joinPlayer("p2", "SCARLET");

        // Place p2 in a different room
        assertTrue(engine.handleMove("p2", "LOUNGE"));

        // Place p1 in HALL
        assertTrue(engine.handleMove("p1", "HALL"));

        // p1 suggests SCARLET with ROPE in HALL
        boolean ok = engine.handleSuggestion("p1", "SCARLET", "ROPE", "HALL");
        assertTrue(ok);

        // SCARLET's player (p2) should now be in HALL
        assertEquals("HALL", engine.getGameState().getPlayer("p2").getCurrentRoom().getName());
        assertTrue(engine.getGameState().getPlayer("p1").hasSuggestedThisTurn());
    }
}
