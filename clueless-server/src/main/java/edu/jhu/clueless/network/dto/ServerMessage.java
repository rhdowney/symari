package edu.jhu.clueless.network.dto;

import java.util.HashMap;
import java.util.Map;

public class ServerMessage {
    private String status;          // "ok" or "error"
    private String event;           // e.g., "JOIN_ACK", "MOVE_ACK", "CHAT"
    private String correlationId;   // mirrors client request
    private Map<String, Object> payload = new HashMap<>();
    private String errorCode;       // for error responses
    private String errorMessage;    // for error responses

    public ServerMessage() {}

    public static ServerMessage ok(String event) {
        ServerMessage m = new ServerMessage();
        m.status = "ok";
        m.event = event;
        return m;
    }

    public static ServerMessage error(String code, String message) {
        ServerMessage m = new ServerMessage();
        m.status = "error";
        m.errorCode = code;
        m.errorMessage = message;
        return m;
    }

    public ServerMessage withCorrelationId(String correlationId) {
        this.correlationId = correlationId;
        return this;
    }

    public ServerMessage withPayload(String key, Object value) {
        if (this.payload == null) this.payload = new HashMap<>();
        this.payload.put(key, value);
        return this;
    }

    public ServerMessage withPayload(Map<String, Object> map) {
        if (map == null) return this;
        if (this.payload == null) this.payload = new HashMap<>();
        this.payload.putAll(map);
        return this;
    }

    // Getters/setters for JsonUtil
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}