package edu.jhu.clueless.network.dto;

public class ClientMessage {
    private String type;
    private String content;

    public ClientMessage() {}

    public ClientMessage(String type, String content) {
        this.type = type;
        this.content = content;
    }

    public String getType() { return type; }
    public String getContent() { return content; }

    public void setType(String type) { this.type = type; }
    public void setContent(String content) { this.content = content; }
}
