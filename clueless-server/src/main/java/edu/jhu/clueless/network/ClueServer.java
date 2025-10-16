package edu.jhu.clueless.network;

import org.java_websocket.server.WebSocketServer;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import java.net.InetSocketAddress;
import edu.jhu.clueless.interfaces.IMessageHandler;

public class ClueServer extends WebSocketServer {

    private int port;
    private IMessageHandler messageHandler;

    public ClueServer(int port) {
        super(new InetSocketAddress(port));
        this.port = port;
        this.messageHandler = new ClueMessageHandler; 
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        System.out.println("New connection from " + conn.getRemoteSocketAddress().getAddress().getHostAddress());
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("Closed connection to " + conn.getRemoteSocketAddress().getAddress().getHostAddress());
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        System.out.println("Message from " + conn.getRemoteSocketAddress().getAddress().getHostAddress() + ": " + message);
        // Handle incoming messages here
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        System.err.println("Error from " + (conn != null ? conn.getRemoteSocketAddress().getAddress().getHostAddress() : "unknown") + ": " + ex.getMessage());
    }

    @Override
    public void onStart() {
        System.out.println("Server started on port " + port);
    }

    public static void main(String[] args) {
        int port = 8080; // Default port
        ClueServer server = new ClueServer(port);
        server.start();
        System.out.println("ClueServer started on port: " + server.getPort());
    }
}



}
