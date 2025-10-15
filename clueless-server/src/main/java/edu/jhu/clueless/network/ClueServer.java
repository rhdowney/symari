package edu.jhu.clueless.network;

public class ClueServer {
    private int port;
    public ClueServer(int port) {this.port = port;}

    public void start(){
        System.out.println("Server started on port " + port);
        // Initialize WebSocket listener here
    }

}
