package edu.jhu.clueless.network;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;


// Open a server socket on a specified port, accept incoming client connections, and handle each connection in a separate thread using a thread pool.

public class ClientHandler {
    private final int port;
    private boolean running = false;
    private final ExecutorService threadPool = Executors.newCachedThreadPool();

    public ClientHandler(int port) {
        this.port = port;
    }

    public void start(){
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            running = true;
            System.out.println("Server listening on port " + port);

            while (running) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("New client connected: " + clientSocket.getInetAddress().getHostAddress());
                threadPool.execute(new ClientConnection(clientSocket));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}