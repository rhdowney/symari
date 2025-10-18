package edu.jhu.clueless.network;

import java.io.*;
import java.net.*;
import java.util.concurrent.*;
import edu.jhu.clueless.util.JsonUtil;

// Open a server socket on a specified port, accept incoming client connections, and handle each connection in a separate thread using a thread pool.

public class ClueServer {
    private final int port;
    private final ExecutorService pool = Executors.newCachedThreadPool();

    public ClueServer(int port) {
        this.port = port;
    }

    public void start(){
        System.out.println("[SERVER] Starting on port " + port + "...");
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            while(true){
                Socket clientSocket = serverSocket.accept();
                System.out.println("[SERVER] New Client connected: " + clientSocket.getInetAddress());
                pool.execute(new ClientHandler(clientSocket));
            }
            
        } catch (IOException e){
            System.err.println("[SERVER] Error: " + e.getMessage());
        }
    }
    public static void main(String[] args) {
        int port = 5000;
        new ClueServer(port).start();
    }
}