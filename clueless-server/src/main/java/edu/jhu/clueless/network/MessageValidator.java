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
            case PING:
                // correlationId is enough
                break;

            case JOIN:
                // Minimal: need a playerId; gameId optional
                requireNonBlank(msg.getPlayerId(), "playerId");
                break;

            case MOVE:
                // Require game/player and a target room
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String, Object> move = requirePayload(msg);
                if (!hasAny(move, "to", "room")) {
                    throw new IllegalArgumentException("Missing move target: one of payload.to|room");
                }
                break;

            case MOVE_TO_HALLWAY:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String, Object> mth = requirePayload(msg);
                if (!hasAny(mth, "hallway", "id", "hallwayId")) {
                    throw new IllegalArgumentException("Missing hallway id: one of payload.hallway|id|hallwayId");
                }
                break;

            case MOVE_FROM_HALLWAY:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String, Object> mfh = requirePayload(msg);
                if (!hasAny(mfh, "to", "room")) {
                    throw new IllegalArgumentException("Missing target room: one of payload.to|room");
                }
                break;

            case SUGGEST:
                // Require suspect, weapon, room
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                requirePayloadKeys(requirePayload(msg), "suspect", "weapon", "room");
                break;

            case ACCUSE:
                // Require suspect, weapon, room
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                requirePayloadKeys(requirePayload(msg), "suspect", "weapon", "room");
                break;

            case END_TURN:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                break;

            case NEW_GAME:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                // payload.keepPlayers is optional; no strict validation needed
                break;

            case JOIN_LOBBY:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                break;

            case SELECT_CHARACTER:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String,Object> sc = requirePayload(msg);
                requirePayloadKeys(sc, "character");
                break;

            case UNSELECT_CHARACTER:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                break;

            case SET_READY:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
                Map<String,Object> rdy = requirePayload(msg);
                if (!hasAny(rdy, "ready")) {
                    throw new IllegalArgumentException("Missing payload.ready");
                }
                break;

            case START_GAME:
                requireNonBlank(msg.getGameId(), "gameId");
                requireNonBlank(msg.getPlayerId(), "playerId");
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