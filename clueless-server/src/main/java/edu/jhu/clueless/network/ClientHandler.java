package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;
import edu.jhu.clueless.util.JsonUtil;

import java.io.*;
import java.net.Socket;
import java.util.UUID;

public class ClientHandler implements Runnable {
    private final Socket socket;
    private final MessageRouter router;

    private BufferedReader in;
    private PrintWriter out;
    private final String clientId = UUID.randomUUID().toString();

    public ClientHandler(Socket socket, MessageRouter router) {
        this.socket = socket;
        this.router = router;
    }

    @Override
    public void run() {
        try {
            in  = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            out = new PrintWriter(new OutputStreamWriter(socket.getOutputStream()), true);

            String line;
            while ((line = in.readLine()) != null) {
                if (line.isBlank()) continue;

                // Parse JSON into ClientMessage and route
                ClientMessage msg = JsonUtil.fromJson(line, ClientMessage.class);
                router.route(clientId, msg, out);
            }
        } catch (IOException ioe) {
            System.err.println("[CLIENT] IO error: " + ioe.getMessage());
        } catch (Exception ex) {
            System.err.println("[CLIENT] Error: " + ex.getMessage());
        } finally {
            try { socket.close(); } catch (IOException ignored) {}
            if (out != null) out.flush();
        }
    }
}