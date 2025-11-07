package edu.jhu.clueless;

import edu.jhu.clueless.network.MessageType;
import edu.jhu.clueless.network.MessageValidator;
import edu.jhu.clueless.network.dto.ClientMessage;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.*;

public class MessageValidatorTest {

    @Test
    public void testSetReadyValid() {
        ClientMessage m = new ClientMessage();
        m.setType(MessageType.SET_READY);
        m.setCorrelationId("c1");
        m.setGameId("g");
        m.setPlayerId("p");
        Map<String,Object> payload = new HashMap<>();
        payload.put("ready", true);
        m.setPayload(payload);
        new MessageValidator().validate(m); // should not throw
    }

    @Test
    public void testUnselectCharacterValid() {
        ClientMessage m = new ClientMessage();
        m.setType(MessageType.UNSELECT_CHARACTER);
        m.setCorrelationId("c2");
        m.setGameId("g");
        m.setPlayerId("p");
        new MessageValidator().validate(m); // should not throw
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMoveToHallwayMissingIdInvalid() {
        ClientMessage m = new ClientMessage();
        m.setType(MessageType.MOVE_TO_HALLWAY);
        m.setCorrelationId("c3");
        m.setGameId("g");
        m.setPlayerId("p");
        m.setPayload(new HashMap<>()); // no hallway id
        new MessageValidator().validate(m);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testSuggestMissingFieldsInvalid() {
        ClientMessage m = new ClientMessage();
        m.setType(MessageType.SUGGEST);
        m.setCorrelationId("c4");
        m.setGameId("g");
        m.setPlayerId("p");
        Map<String,Object> payload = new HashMap<>();
        payload.put("suspect", "PLUM");
        payload.put("weapon", "ROPE");
        // missing room
        m.setPayload(payload);
        new MessageValidator().validate(m);
    }

    @Test
    public void testMoveWithRoomValid() {
        ClientMessage m = new ClientMessage();
        m.setType(MessageType.MOVE);
        m.setCorrelationId("c5");
        m.setGameId("g");
        m.setPlayerId("p");
        Map<String,Object> payload = new HashMap<>();
        payload.put("room", "HALL");
        m.setPayload(payload);
        new MessageValidator().validate(m); // should not throw
    }
}
