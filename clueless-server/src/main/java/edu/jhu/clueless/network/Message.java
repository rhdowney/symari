package edu.jhu.clueless.network;

public class Message {
    public String type;
    public String content;

    public Message(String type, String content) {
        this.type = type;
        this.content = content;
    }
}
