package edu.jhu.clueless.network;


import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;


public class ClueServer implements Runnable {
    private final int port;
    private final MessageRouter router;
    private final ExecutorService pool;

    public ClueServer(int port, MessageRouter router) {
        this.port = port;
        this.router = router;
        this.pool = Executors.newFixedThreadPool(Math.max(4, Runtime.getRuntime().availableProcessors() * 2));
    }

    public void start() {
        ServerSocket server = null;
        try {
            server = new ServerSocket();
            server.setReuseAddress(true);
            server.bind(new InetSocketAddress(port));
            System.out.println("Server listening on " + port);
            while (!pool.isShutdown()) {
                Socket socket = server.accept();
                System.out.println("[SERVER] Client connected: " + socket.getRemoteSocketAddress());
                pool.execute(new ClientHandler(socket, router));
            }
        } catch (IOException e) {
            System.err.println("[SERVER] Error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            if (server != null) {
                try { server.close(); } catch (IOException ignored) {}
            }
            pool.shutdown();
        }
    }

    @Override
    public void run() {
        start();
    }
}