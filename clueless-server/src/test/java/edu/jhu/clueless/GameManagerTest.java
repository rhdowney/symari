package edu.jhu.clueless;

import edu.jhu.clueless.engine.*;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.Assert.*;

public class GameManagerTest {

    @Test
    public void testSetupAndDealDistributesDeckAndSetsSolution() {
        GameState gs = new GameState();
        Board board = Board.standard();
        board.applyTo(gs);

        // three players
        Player a = new Player("alice", "GREEN");
        Player b = new Player("bob", "PLUM");
        Player c = new Player("cara", "SCARLET");
        gs.addPlayer(a); gs.addPlayer(b); gs.addPlayer(c);

        Random rng = new Random(12345);
        GameManager.DealResult res = GameManager.setupAndDeal(gs, board, rng);
        assertNotNull(res.solution);
        Solution s = gs.getSolution();
        assertNotNull(s);

        // Count total cards dealt: 6 suspects + 6 weapons + 9 rooms - 3 for solution = 18
        int total = handSize(a) + handSize(b) + handSize(c);
        assertEquals(18, total);

        // No hand should contain any of the solution components
        assertFalse(containsCard(a, s.getSuspect()));
        assertFalse(containsCard(b, s.getSuspect()));
        assertFalse(containsCard(c, s.getSuspect()));

        assertFalse(containsCard(a, s.getWeapon()));
        assertFalse(containsCard(b, s.getWeapon()));
        assertFalse(containsCard(c, s.getWeapon()));

        assertFalse(containsCard(a, s.getRoom()));
        assertFalse(containsCard(b, s.getRoom()));
        assertFalse(containsCard(c, s.getRoom()));

        // Hand sizes should be balanced (difference at most 1)
        List<Integer> sizes = new ArrayList<>();
        sizes.add(handSize(a)); sizes.add(handSize(b)); sizes.add(handSize(c));
        int min = Math.min(sizes.get(0), Math.min(sizes.get(1), sizes.get(2)));
        int max = Math.max(sizes.get(0), Math.max(sizes.get(1), sizes.get(2)));
        assertTrue(max - min <= 1);
    }

    private int handSize(Player p) { return p.getHand() == null ? 0 : p.getHand().size(); }
    private boolean containsCard(Player p, String name) {
        if (p.getHand() == null) return false;
        for (Card c : p.getHand()) if (c.getName().equalsIgnoreCase(name)) return true;
        return false;
    }
}
