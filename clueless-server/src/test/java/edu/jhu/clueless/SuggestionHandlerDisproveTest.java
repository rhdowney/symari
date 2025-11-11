package edu.jhu.clueless;

import edu.jhu.clueless.engine.*;
import org.junit.Test;

import static org.junit.Assert.*;

public class SuggestionHandlerDisproveTest {

    @Test
    public void testDisproveFirstPlayerWithMatchingCard() {
        GameState gs = new GameState();
        Board board = Board.standard();
        board.applyTo(gs);

        // Players in insertion order: A, B, C
        Player a = new Player("alice", "GREEN");
        Player b = new Player("bob", "PLUM");
        Player c = new Player("cara", "SCARLET");
        gs.addPlayer(a); gs.addPlayer(b); gs.addPlayer(c);

        // Place suggester in a room
        Room hall = gs.getRoom("HALL");
        a.setCurrentRoom(hall);

        // Give B a matching weapon card, C a matching suspect card; B should disprove first
        b.initEmptyHand(); c.initEmptyHand(); a.initEmptyHand();
        b.addCard(new Card("DAGGER", Card.Type.WEAPON));
        c.addCard(new Card("PLUM", Card.Type.CHARACTER));

        SuggestionHandler sh = new SuggestionHandler(gs);
        SuggestionResult res = sh.handleSuggestion("alice", "PLUM", "DAGGER", "HALL");

        assertTrue(res.isAccepted());
        assertEquals("bob", res.getDisprover());
        assertEquals("DAGGER", res.getRevealedCard());
    }
}
