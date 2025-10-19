package edu.jhu.clueless;

import edu.jhu.clueless.network.ClueServer;
import edu.jhu.clueless.network.MessageRouter;
import edu.jhu.clueless.network.WsBridgeServer;

public class App {
    public static void main(String[] args) throws Exception {
        int tcpPort = 8080;
        int wsPort = 8081;

        MessageRouter router = new MessageRouter();

        // Start TCP server
        Thread tcp = new Thread(new ClueServer(tcpPort, router), "clue-tcp");
        tcp.setDaemon(true);
        tcp.start();

        // Start WebSocket server
        WsBridgeServer ws = new WsBridgeServer(wsPort, router);
        ws.start();

        System.out.println("[APP] Servers up. TCP: " + tcpPort + " WS: " + wsPort);
    }
}
