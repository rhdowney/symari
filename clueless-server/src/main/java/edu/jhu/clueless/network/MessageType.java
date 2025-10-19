package edu.jhu.clueless.network.dto;

import edu.jhu.clueless.network.MessageType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClientMessage {
    private MessageType type;
    private String correlationId;
    private String gameId;
    private String playerId;
    private Map<String, Object> payload;

    public ClientMessage() {}

    @JsonCreator
    public ClientMessage(
            @JsonProperty("type") MessageType type,
            @JsonProperty("correlationId") String correlationId,
            @JsonProperty("gameId") String gameId,
            @JsonProperty("playerId") String playerId,
            @JsonProperty("payload") Map<String, Object> payload) {
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