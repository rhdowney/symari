package edu.jhu.clueless;

import edu.jhu.clueless.engine.Lobby;
import org.junit.Test;

import static org.junit.Assert.*;

public class LobbyTest {

    @Test
    public void testJoinSelectReadyAndUnselect() {
        Lobby lobby = new Lobby("g1");

        lobby.join("alice");
        lobby.join("bob");

        assertTrue(lobby.getPlayers().contains("alice"));
        assertTrue(lobby.getPlayers().contains("bob"));
        assertFalse(lobby.isReady("alice"));

        // select unique characters
        assertTrue(lobby.selectCharacter("alice", "GREEN"));
        assertFalse("Cannot take an already selected character", lobby.selectCharacter("bob", "GREEN"));
        assertTrue(lobby.selectCharacter("bob", "PLUM"));

        assertTrue(lobby.allSelectedCharacters());

        // set readiness
        lobby.setReady("alice", true);
        lobby.setReady("bob", true);
        assertTrue(lobby.allReady());

        // unselect a character
        assertTrue(lobby.unselectCharacter("alice"));
        assertFalse(lobby.allSelectedCharacters());
        // character GREEN becomes available again
        assertTrue(lobby.getAvailableCharacters().contains("GREEN"));
    }
}
