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

    @Override
    public String toString() {
        return "ClientMessage{type='" + type + "', content='" + content + "'}";
}
