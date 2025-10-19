package edu.jhu.clueless.network.dto;

import edu.jhu.clueless.network.MessageType;
import java.util.Map;

public class ClientMessage {
    private MessageType type;
    private String correlationId;
    private String gameId;
    private String playerId;
    private Map<String, Object> payload;

    public ClientMessage() { }

    public ClientMessage(MessageType type, String correlationId, String gameId, String playerId, Map<String, Object> payload) {
        this.type = type;
        this.correlationId = correlationId;
        this.gameId = gameId;
        this.playerId = playerId;
        this.payload = payload;
    }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
}