package edu.jhu.clueless.network;

import edu.jhu.clueless.engine.AccusationResult;
import edu.jhu.clueless.engine.GameEngine;
import edu.jhu.clueless.engine.GameState;
import edu.jhu.clueless.engine.Player;
import edu.jhu.clueless.engine.Room;
import edu.jhu.clueless.engine.RuleValidator;
import edu.jhu.clueless.network.dto.ClientMessage;
import edu.jhu.clueless.util.JsonUtil;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class MessageRouter {
    private final Map<String, GameEngine> games = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> joined = new ConcurrentHashMap<>();
    private final Map<String, Set<PrintWriter>> subscribers = new ConcurrentHashMap<>(); // gameId -> client writers

    public MessageRouter() { }

    private GameEngine getOrCreateEngine(String gameId) {
        String id = (gameId == null || gameId.isBlank()) ? "default" : gameId;
        return games.computeIfAbsent(id, k -> new GameEngine(new GameState()));
    }

    private void send(PrintWriter out, String json) {
        out.println(json);
        System.out.println("[ROUTER OUT] " + json);
    }

    private void subscribe(String gameId, PrintWriter out) {
        subscribers.computeIfAbsent(gameId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>())).add(out);
    }
    private void broadcast(String gameId, String json, PrintWriter exclude) {
        var set = subscribers.getOrDefault(gameId, Collections.emptySet());
        for (PrintWriter w : set) {
            if (w == null || w == exclude) continue;
            try { w.println(json); } catch (Exception ignored) {}
        }
        System.out.println("[BROADCAST] " + json);
    }

    public void route(String clientId, ClientMessage msg, PrintWriter out) {
        try {
            if (msg == null || msg.getType() == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Invalid or missing type\"}"); return; }
            switch (msg.getType()) {
                case PING: {
                    send(out, "{\"type\":\"PONG\",\"payload\":\"" + esc(clientId) + "\"}");
                    break;
                }
                case JOIN: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId","name"));
                    GameEngine engine = getOrCreateEngine(gameId);
                    Player p = engine.joinPlayer(playerId, firstString(msg.getPayload(), "character","characterName"));
                    joined.computeIfAbsent(gameId, k -> ConcurrentHashMap.newKeySet()).add(playerId);
                    subscribe(gameId, out);

                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState()));
                    send(out, "{\"type\":\"ACK\",\"for\":\"JOIN\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(p.getName()) + "\",\"state\":" + stateJson + "}");
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"JOIN\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"state\":" + stateJson + "}", out);
                    break;
                }
                case MOVE: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId"));
                    String room = firstString(msg.getPayload(), "to","room");
                    if (playerId == null || room == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Missing playerId or room\"}"); break; }
                    if (!joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join first\"}"); break; }

                    GameEngine engine = getOrCreateEngine(gameId);
                    var gs = engine.getGameState();
                    if (gs.isGameOver()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Game over\"}"); break; }

                    Player p = gs.getPlayer(playerId);
                    Room target = gs.getRoom(room);
                    if (p == null || target == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Unknown player or room\"}"); break; }
                    if (!p.isActive()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Player eliminated\"}"); break; }
                    if (!engine.isPlayersTurn(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not your turn\"}"); break; }
                    if (p.hasMovedThisTurn() && p.getCurrentRoom() != null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Already moved this turn\"}"); break; }
                    if (p.getCurrentRoom() != null && !RuleValidator.canMove(p, target)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not adjacent\"}"); break; }

                    boolean ok = engine.handleMove(playerId, room);
                    if (ok) {
                        String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState()));
                        String ack = "{\"type\":\"ACK\",\"for\":\"MOVE\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"room\":\"" + esc(room) + "\",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"MOVE\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"room\":\"" + esc(room) + "\",\"state\":" + stateJson + "}", out);
                    } else {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Illegal move\"}");
                    }
                    break;
                }
                case SUGGEST: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId"));
                    String suspect = firstString(msg.getPayload(), "suspect");
                    String weapon = firstString(msg.getPayload(), "weapon");
                    String room = firstString(msg.getPayload(), "room");
                    if (!joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join first\"}"); break; }

                    GameEngine engine = getOrCreateEngine(gameId);
                    var gs = engine.getGameState();
                    if (gs.isGameOver()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Game over\"}"); break; }

                    Player p = gs.getPlayer(playerId);
                    if (p == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Unknown player\"}"); break; }
                    if (!p.isActive()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Player eliminated\"}"); break; }
                    if (!engine.isPlayersTurn(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not your turn\"}"); break; }
                    if (p.hasSuggestedThisTurn()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Already suggested this turn\"}"); break; }
                    if (!RuleValidator.canSuggest(p)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Must be in a room\"}"); break; }
                    if (room == null || p.getCurrentRoom() == null || !p.getCurrentRoom().getName().equalsIgnoreCase(room)) {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Suggestion must be for your current room\"}");
                        break;
                    }

                    boolean ok = engine.handleSuggestion(playerId, suspect, weapon, room);
                    if (ok) {
                        String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState()));
                        String ack = "{\"type\":\"ACK\",\"for\":\"SUGGEST\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"SUGGEST\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"state\":" + stateJson + "}", out);
                    } else {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Cannot suggest now\"}");
                    }
                    break;
                }
                case ACCUSE: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId"));
                    String suspect = firstString(msg.getPayload(), "suspect");
                    String weapon = firstString(msg.getPayload(), "weapon");
                    String room = firstString(msg.getPayload(), "room");
                    if (!joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join first\"}"); break; }

                    GameEngine engine = getOrCreateEngine(gameId);
                    var gs = engine.getGameState();
                    if (gs.isGameOver()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Game over\"}"); break; }

                    Player p = gs.getPlayer(playerId);
                    if (p == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Unknown player\"}"); break; }
                    if (!p.isActive()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Player eliminated\"}"); break; }
                    if (!engine.isPlayersTurn(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not your turn\"}"); break; }
                    if (!RuleValidator.isValidAccusation(suspect, weapon, room)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Invalid accusation\"}"); break; }

                    AccusationResult res = engine.handleAccusation(playerId, suspect, weapon, room);
                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState()));
                    if (res.isCorrect()) {
                        String ack = "{\"type\":\"ACK\",\"for\":\"ACCUSE\",\"result\":\"WIN\",\"gameOver\":true,\"winner\":\"" + esc(res.getWinner()) + "\",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"ACCUSE\",\"result\":\"WIN\",\"gameOver\":true,\"winner\":\"" + esc(res.getWinner()) + "\",\"gameId\":\"" + esc(gameId) + "\",\"by\":\"" + esc(playerId) + "\",\"state\":" + stateJson + "}", out);
                    } else {
                        String ack = "{\"type\":\"ACK\",\"for\":\"ACCUSE\",\"result\":\"LOSE\",\"eliminated\":" + res.isEliminated() + ",\"gameOver\":" + res.isGameOver() + (res.isGameOver() && res.getWinner()!=null ? ",\"winner\":\"" + esc(res.getWinner()) + "\"" : "") + ",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"ACCUSE\",\"result\":\"LOSE\",\"gameOver\":" + res.isGameOver() + (res.isGameOver() && res.getWinner()!=null ? ",\"winner\":\"" + esc(res.getWinner()) + "\"" : "") + ",\"gameId\":\"" + esc(gameId) + "\",\"by\":\"" + esc(playerId) + "\",\"state\":" + stateJson + "}", out);
                    }
                    break;
                }
                case END_TURN: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId"));
                    if (!joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join first\"}"); break; }
                    GameEngine engine = getOrCreateEngine(gameId);
                    var gs = engine.getGameState();
                    if (gs.isGameOver()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Game over\"}"); break; }

                    Player p = gs.getPlayer(playerId);
                    if (p == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Unknown player\"}"); break; }
                    if (!p.isActive()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Player eliminated\"}"); break; }
                    if (!engine.isPlayersTurn(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not your turn\"}"); break; }

                    engine.advanceTurn();
                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState()));
                    String ack = "{\"type\":\"ACK\",\"for\":\"END_TURN\",\"gameId\":\"" + esc(gameId) + "\",\"state\":" + stateJson + "}";
                    send(out, ack);
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"TURN\",\"gameId\":\"" + esc(gameId) + "\",\"state\":" + stateJson + "}", out);
                    break;
                }
                case NEW_GAME: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId"));
                    boolean keepPlayers = firstBool(msg.getPayload(), "keepPlayers", true);

                    if (!joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).contains(playerId)) {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Join first\"}");
                        break;
                    }

                    ArrayList<String> playersToKeep = new ArrayList<>();
                    if (keepPlayers) {
                        var set = joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet());
                        var existing = games.get(gameId);
                        if (existing != null && existing.getGameState() != null) {
                            existing.getGameState().getPlayers().values().forEach(p -> {
                                if (set.contains(p.getName())) playersToKeep.add(p.getName());
                            });
                            set.forEach(pn -> { if (!playersToKeep.contains(pn)) playersToKeep.add(pn); });
                        } else {
                            set.forEach(playersToKeep::add);
                        }
                    } else {
                        joined.computeIfAbsent(gameId, k -> ConcurrentHashMap.newKeySet()).clear();
                        joined.get(gameId).add(playerId);
                    }

                    // Recreate engine via the same path used elsewhere
                    games.remove(gameId);
                    GameEngine engine = getOrCreateEngine(gameId);

                    for (String pn : playersToKeep) {
                        engine.joinPlayer(pn, pn);
                        joined.computeIfAbsent(gameId, k -> ConcurrentHashMap.newKeySet()).add(pn);
                    }

                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState()));
                    String ack = "{\"type\":\"ACK\",\"for\":\"NEW_GAME\",\"gameId\":\"" + esc(gameId) + "\",\"keepPlayers\":" + keepPlayers + ",\"state\":" + stateJson + "}";
                    send(out, ack);
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"NEW_GAME\",\"gameId\":\"" + esc(gameId) + "\",\"keepPlayers\":" + keepPlayers + ",\"state\":" + stateJson + "}", out);
                    break;
                }
                // ...existing cases...
                default: send(out, "{\"type\":\"ERROR\",\"message\":\"Unknown type\"}");
            }
        } catch (Exception e) {
            send(out, "{\"type\":\"ERROR\",\"message\":\"" + esc(e.getMessage()) + "\"}");
        }
    }

    private static Map<String, Object> buildSnapshot(GameState gs) {
        Map<String, Object> root = new LinkedHashMap<>();
        List<Map<String, Object>> players = new ArrayList<>();
        for (Player p : gs.getPlayers().values()) {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("name", p.getName());
            pm.put("character", p.getCharacterName());
            pm.put("room", p.getCurrentRoom() != null ? p.getCurrentRoom().getName() : null);
            pm.put("active", p.isActive());
            players.add(pm);
        }
        root.put("players", players);

        List<Map<String, Object>> rooms = new ArrayList<>();
        for (Room r : gs.getRooms().values()) {
            Map<String, Object> rm = new LinkedHashMap<>();
            rm.put("name", r.getName());
            List<String> occ = new ArrayList<>();
            for (Player p : r.getOccupants()) occ.add(p.getName());
            rm.put("occupants", occ);
            rooms.add(rm);
        }
        root.put("rooms", rooms);
        root.put("currentPlayer", gs.getCurrentPlayer() != null ? gs.getCurrentPlayer().getName() : null);
        root.put("gameOver", gs.isGameOver());
        root.put("winner", gs.getWinner());
        return root;
    }

    private static String firstString(Map<String, Object> payload, String... keys) {
        if (payload == null) return null;
        for (String k : keys) {
            Object v = payload.get(k);
            if (v != null) return String.valueOf(v);
        }
        return null;
    }
    private static String nz(String v, String def) { return (v == null || v.isBlank()) ? def : v; }
    private static String esc(String s) { return s == null ? "" : s.replace("\\","\\\\").replace("\"","\\\""); }
    private static boolean firstBool(Map<String, Object> payload, String key, boolean def) {
        if (payload == null) return def;
        Object v = payload.get(key);
        if (v instanceof Boolean) return (Boolean) v;
        if (v instanceof String) {
            String s = ((String) v).trim().toLowerCase();
            if (s.equals("true") || s.equals("1") || s.equals("yes") || s.equals("y")) return true;
            if (s.equals("false") || s.equals("0") || s.equals("no") || s.equals("n")) return false;
        }
        return def;
    }
}