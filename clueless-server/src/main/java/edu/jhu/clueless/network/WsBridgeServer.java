package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;
import edu.jhu.clueless.util.JsonUtil;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.Writer;
import java.net.InetSocketAddress;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class WsBridgeServer extends WebSocketServer {
    private final MessageRouter router;
    private final Map<WebSocket, String> ids = new ConcurrentHashMap<>();

    public WsBridgeServer(int port, MessageRouter router) {
        super(new InetSocketAddress(port));
        this.router = router;
    }

    @Override public void onStart() {
        System.out.println("[WS] Listening on ws://localhost:" + getPort());
    }

    @Override public void onOpen(WebSocket conn, ClientHandshake handshake) {
        String id = UUID.randomUUID().toString();
        ids.put(conn, id);
        System.out.println("[WS] Client connected: " + conn.getRemoteSocketAddress() + " id=" + id);
    }

    @Override public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("[WS] Client disconnected: " + reason);
        ids.remove(conn);
    }

    @Override public void onMessage(WebSocket conn, String message) {
        String id = ids.getOrDefault(conn, "ws-unknown");
        try {
            ClientMessage msg = JsonUtil.fromJson(message, ClientMessage.class);
            PrintWriter out = new PrintWriter(new WsWriter(conn), true);
            router.route(id, msg, out);
        } catch (Exception e) {
            try { conn.send("{\"type\":\"ERROR\",\"message\":\"" + esc(e.getMessage()) + "\"}"); } catch (Exception ignore) {}
        }
    }

    @Override public void onError(WebSocket conn, Exception ex) {
        System.out.println("[WS] Error: " + ex.getMessage());
    }

    private static String esc(String s) { return s == null ? "" : s.replace("\\","\\\\").replace("\"","\\\""); }

    static final class WsWriter extends Writer {
        private final WebSocket conn;
        private final StringBuilder buf = new StringBuilder();
        WsWriter(WebSocket conn) { this.conn = conn; }
        @Override public void write(char[] cbuf, int off, int len) { buf.append(cbuf, off, len); }
        @Override public void flush() throws IOException {
            if (buf.length() == 0) return;
            String s = buf.toString();
            buf.setLength(0);
            if (conn != null && conn.isOpen()) {
                try { conn.send(s); } catch (Exception e) { throw new IOException(e); }
            }
        }
        @Override public void close() throws IOException { flush(); }
    }
}