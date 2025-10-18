package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;
import edu.jhu.clueless.network.dto.ServerMessage;
import edu.jhu.clueless.util.JsonUtil;
import java.io.*;
import java.net.*;

public class ClientHandler implements Runnable {
    private final Socket socket;

    public ClientHandler(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {

            String line;
            while ((line = in.readLine()) != null) {
                System.out.println("[SERVER] Received: " + line);

                // Parse incoming JSON
                ClientMessage message = JsonUtil.fromJson(line, ClientMessage.class);

                // Build response
                ServerMessage response = new ServerMessage("ack", "Message received: " + message.getContent());
                out.println(JsonUtil.toJson(response));
            }
        } catch (IOException e) {
            System.err.println("[CLIENT] Disconnected: " + e.getMessage());
        }
    }
}