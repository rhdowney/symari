package edu.jhu.clueless.network.dto;

public class ServerMessage {
    private String status;
    private String response;

    public ServerMessage(String status, String response) {
        this.status = status;
        this.response = response;
    }

    public String getStatus() { return status; }
    public String getResponse() { return response; }
}
