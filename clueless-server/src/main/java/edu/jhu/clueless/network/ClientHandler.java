package edu.jhu.clueless.network;

import com.google.gson.Gson;
import edu.jhu.clueless.network.dto.ClientMessage;
import edu.jhu.clueless.network.dto.ServerMessage;
import edu.jhu.clueless.util.JsonUtil;

import java.io.*;
import java.net.Socket;

public class ClientHandler implements Runnable {
    private final Socket socket;
    private final Gson gson = new Gson();

    public ClientHandler(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {

            String input;
            while ((input = in.readLine()) != null) {
                ClientMessage msg = gson.fromJson(input, ClientMessage.class);
                System.out.println("Received: " + msg);

                // simple echo reply
                ServerMessage reply = new ServerMessage("ACK", "Received your message");
                out.println(JsonUtil.toJson(reply));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}