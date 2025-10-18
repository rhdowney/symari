package edu.jhu.clueless.network.dto;

public class ServerMessage {
    private String type;
    private String message;

    public ServerMessage() {}

    public ServerMessage(String type, String message) {
        this.type = type;
        this.message = message;
    }

    public String getType() { return type; }
    public String getMessage() { return message; }

    public void setType(String type) { this.type = type; }
    public void setMessage(String message) { this.message = message; }
}
