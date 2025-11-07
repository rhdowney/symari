package edu.jhu.clueless;

import edu.jhu.clueless.engine.*;
import org.junit.Test;

import static org.junit.Assert.*;

public class RuleValidatorTest {

    @Test
    public void testCanMoveUsesBoardAdjacency() {
        GameState gs = new GameState();
        Board board = Board.standard();
        board.applyTo(gs);

        Player p = new Player("alice", "GREEN");
        gs.addPlayer(p);
        Room hall = gs.getRoom("HALL");
        Room lounge = gs.getRoom("LOUNGE");
        Room kitchen = gs.getRoom("KITCHEN");
        p.setCurrentRoom(hall);

        assertTrue("Adjacent rooms should be allowed", RuleValidator.canMove(p, lounge, board));
        assertFalse("Non-adjacent rooms should be blocked", RuleValidator.canMove(p, kitchen, board));
    }

    @Test
    public void testHallwayMovementHelpers() {
        GameState gs = new GameState();
        Board board = Board.standard();
        board.applyTo(gs);
        Player p = new Player("bob", "PLUM");
        gs.addPlayer(p);

        Room hall = gs.getRoom("HALL");
        Room lounge = gs.getRoom("LOUNGE");
        Board.Hallway h = board.getHallwayBetween(hall, lounge);
        assertNotNull(h);

        p.setCurrentRoom(hall);

        // hallway free -> can enter
        assertTrue(RuleValidator.canMoveToHallway(p, h, board));

        // occupy hallway with someone else -> cannot enter
        Player other = new Player("eve", "WHITE");
        gs.addPlayer(other);
        h.occupy(other);
        assertFalse(RuleValidator.canMoveToHallway(p, h, board));

        // Free hallway and put player in it
        h.vacate();
        h.occupy(p);
        p.setLocation(h);

        // can exit into either endpoint
        assertTrue(RuleValidator.canMoveFromHallway(p, hall, board));
        assertTrue(RuleValidator.canMoveFromHallway(p, lounge, board));
        // cannot exit into a non-adjacent room
        Room kitchen = gs.getRoom("KITCHEN");
        assertFalse(RuleValidator.canMoveFromHallway(p, kitchen, board));
    }

    @Test
    public void testCanSuggestInCurrentRoom() {
        GameState gs = new GameState();
        Board board = Board.standard();
        board.applyTo(gs);
        Player p = new Player("cara", "SCARLET");
        gs.addPlayer(p);
        Room study = gs.getRoom("STUDY");
        p.setCurrentRoom(study);

        assertTrue(RuleValidator.canSuggest(p));
        assertTrue(RuleValidator.canSuggestInCurrentRoom(p, "STUDY"));
        assertTrue(RuleValidator.canSuggestInCurrentRoom(p, "study"));
        assertFalse(RuleValidator.canSuggestInCurrentRoom(p, "HALL"));
    }
}
