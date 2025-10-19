package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;

import java.util.Map;

public class MessageValidator {

    // Throws IllegalArgumentException if invalid; no-op if valid.
    public void validate(ClientMessage msg) {
        if (msg == null) throw new IllegalArgumentException("Null message");
        if (msg.getType() == null) throw new IllegalArgumentException("Missing type");
        requireNonBlank(msg.getCorrelationId(), "correlationId"); // required for pairing

        switch (msg.getType()) {
            case JOIN:
                // Minimal: need a playerId; gameId optional
                requireNonBlank(msg.getPlayerId(), "playerId");
                break;

            case MOVE:
                // Require game/player and a target hint in payload
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String, Object> move = requirePayload(msg);
                if (!hasAny(move, "to", "direction", "room")) {
                    throw new IllegalArgumentException("Missing move target: one of payload.to|direction|room");
                }
                break;

            case SUGGESTION:
                // Require suspect, weapon, room
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                requirePayloadKeys(requirePayload(msg), "suspect", "weapon", "room");
                break;

            case ACCUSATION:
                // Require suspect, weapon, room
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                requirePayloadKeys(requirePayload(msg), "suspect", "weapon", "room");
                break;

            case CHAT:
                // Require player and non-blank text
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String, Object> chat = requirePayload(msg);
                Object text = chat.get("text");
                if (text == null || text.toString().trim().isEmpty()) {
                    throw new IllegalArgumentException("Missing payload.text");
                }
                break;

            case HEARTBEAT:
                // correlationId already enforced
                break;

            default:
                // Unknown types are handled in the router
                break;
        }
    }

    // Helpers

    private void requireNonBlank(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Missing " + field);
        }
    }

    private Map<String, Object> requirePayload(ClientMessage msg) {
        Map<String, Object> p = msg.getPayload();
        if (p == null) throw new IllegalArgumentException("Missing payload");
        return p;
    }

    private void requirePayloadKeys(Map<String, Object> p, String... keys) {
        for (String k : keys) {
            if (p.get(k) == null) {
                throw new IllegalArgumentException("Missing payload." + k);
            }
        }
    }

    private boolean hasAny(Map<String, Object> p, String... keys) {
        for (String k : keys) {
            if (p.containsKey(k)) return true;
        }
        return false;
    }
}