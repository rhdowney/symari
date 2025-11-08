package edu.jhu.clueless.network;

import edu.jhu.clueless.engine.*;
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
    private final Map<String, Lobby> lobbies = new ConcurrentHashMap<>();

    public MessageRouter() { }

    private GameEngine getOrCreateEngine(String gameId) {
        String id = (gameId == null || gameId.isBlank()) ? "default" : gameId;
        return games.computeIfAbsent(id, k -> new GameEngine(new GameState()));
    }
    private Lobby getOrCreateLobby(String gameId) {
        String id = (gameId == null || gameId.isBlank()) ? "default" : gameId;
        return lobbies.computeIfAbsent(id, k -> new Lobby(id));
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
                case JOIN_LOBBY: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId","name"));
                    Lobby lobby = getOrCreateLobby(gameId);
                    lobby.join(playerId);
                    subscribe(gameId, out);

                    String lobbyJson = JsonUtil.toJson(buildLobbySnapshot(lobby));
                    send(out, "{\"type\":\"ACK\",\"for\":\"JOIN_LOBBY\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}");
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"LOBBY_JOIN\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}", out);
                    break;
                }
                case SELECT_CHARACTER: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId","name"));
                    String character = firstString(msg.getPayload(), "character");
                    Lobby lobby = getOrCreateLobby(gameId);
                    if (!lobby.getPlayers().contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join lobby first\"}"); break; }
                    if (!lobby.selectCharacter(playerId, character)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Character unavailable\"}"); break; }

                    String lobbyJson = JsonUtil.toJson(buildLobbySnapshot(lobby));
                    send(out, "{\"type\":\"ACK\",\"for\":\"SELECT_CHARACTER\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}");
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"CHARACTER_SELECTED\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}", out);
                    break;
                }
                case UNSELECT_CHARACTER: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId","name"));
                    Lobby lobby = getOrCreateLobby(gameId);
                    if (!lobby.getPlayers().contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join lobby first\"}"); break; }
                    boolean ok = lobby.unselectCharacter(playerId);
                    if (!ok) { send(out, "{\"type\":\"ERROR\",\"message\":\"No selection to remove\"}"); break; }
                    String lobbyJson = JsonUtil.toJson(buildLobbySnapshot(lobby));
                    send(out, "{\"type\":\"ACK\",\"for\":\"UNSELECT_CHARACTER\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}");
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"CHARACTER_UNSELECTED\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}", out);
                    break;
                }
                case SET_READY: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId","name"));
                    boolean ready = Boolean.parseBoolean(String.valueOf(msg.getPayload().get("ready")));
                    Lobby lobby = getOrCreateLobby(gameId);
                    if (!lobby.getPlayers().contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join lobby first\"}"); break; }
                    lobby.setReady(playerId, ready);
                    String lobbyJson = JsonUtil.toJson(buildLobbySnapshot(lobby));
                    send(out, "{\"type\":\"ACK\",\"for\":\"SET_READY\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}");
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"READY_CHANGED\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"lobby\":" + lobbyJson + "}", out);
                    break;
                }
                case START_GAME: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId","name"));
                    Lobby lobby = getOrCreateLobby(gameId);
                    // checks: at least 2 players, all have selected characters, all ready
                    if (lobby.getPlayers().size() < 2) { send(out, "{\"type\":\"ERROR\",\"message\":\"Need at least 2 players\"}"); break; }
                    if (!lobby.allSelectedCharacters()) { send(out, "{\"type\":\"ERROR\",\"message\":\"All players must select a character\"}"); break; }
                    if (!lobby.allReady()) { send(out, "{\"type\":\"ERROR\",\"message\":\"All players must be ready\"}"); break; }
                    // Recreate engine and join players with selected characters
                    games.remove(gameId);
                    GameEngine engine = getOrCreateEngine(gameId);
                    for (String pn : lobby.getPlayers()) {
                        String ch = lobby.getSelections().getOrDefault(pn, pn);
                        engine.joinPlayer(pn, ch);
                        joined.computeIfAbsent(gameId, k -> ConcurrentHashMap.newKeySet()).add(pn);
                    }
                    engine.startGame();
                    lobby.setStarted(true);

                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
                    send(out, "{\"type\":\"ACK\",\"for\":\"START_GAME\",\"gameId\":\"" + esc(gameId) + "\",\"state\":" + stateJson + "}");
                    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"START_GAME\",\"gameId\":\"" + esc(gameId) + "\",\"state\":" + stateJson + "}", out);
                    break;
                }
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

                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
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
                    if (p.getCurrentRoom() != null && !engine.getBoard().areAdjacent(p.getCurrentRoom(), target)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not adjacent\"}"); break; }

                    boolean ok = engine.handleMove(playerId, room);
                    if (ok) {
                        String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
                        String ack = "{\"type\":\"ACK\",\"for\":\"MOVE\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"room\":\"" + esc(room) + "\",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"MOVE\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"room\":\"" + esc(room) + "\",\"state\":" + stateJson + "}", out);
                    } else {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Illegal move\"}");
                    }
                    break;
                }
                case MOVE_TO_HALLWAY: {
                    String gameId = nz(msg.getGameId(), "default");
                    String playerId = nz(msg.getPlayerId(), firstString(msg.getPayload(), "player","playerId"));
                    String hallwayId = firstString(msg.getPayload(), "hallway","id","hallwayId");
                    if (playerId == null || hallwayId == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Missing playerId or hallwayId\"}"); break; }
                    if (!joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).contains(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Join first\"}"); break; }

                    GameEngine engine = getOrCreateEngine(gameId);
                    var gs = engine.getGameState();
                    if (gs.isGameOver()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Game over\"}"); break; }

                    Player p = gs.getPlayer(playerId);
                    if (p == null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Unknown player\"}"); break; }
                    if (!p.isActive()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Player eliminated\"}"); break; }
                    if (!engine.isPlayersTurn(playerId)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not your turn\"}"); break; }
                    if (p.hasMovedThisTurn() && p.getCurrentRoom() != null) { send(out, "{\"type\":\"ERROR\",\"message\":\"Already moved this turn\"}"); break; }

                    boolean ok = engine.handleMoveToHallway(playerId, hallwayId);
                    if (ok) {
                        String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
                        String ack = "{\"type\":\"ACK\",\"for\":\"MOVE_TO_HALLWAY\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"hallway\":\"" + esc(hallwayId) + "\",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"MOVE_TO_HALLWAY\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"hallway\":\"" + esc(hallwayId) + "\",\"state\":" + stateJson + "}", out);
                    } else {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Illegal hallway move\"}");
                    }
                    break;
                }
                case MOVE_FROM_HALLWAY: {
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
                    if (!(p.getLocation() instanceof Board.Hallway)) { send(out, "{\"type\":\"ERROR\",\"message\":\"Not in a hallway\"}"); break; }
                    if (p.hasMovedThisTurn()) { send(out, "{\"type\":\"ERROR\",\"message\":\"Already moved this turn\"}"); break; }

                    boolean ok = engine.handleMoveFromHallwayToRoom(playerId, room);
                    if (ok) {
                        String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
                        String ack = "{\"type\":\"ACK\",\"for\":\"MOVE_FROM_HALLWAY\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"room\":\"" + esc(room) + "\",\"state\":" + stateJson + "}";
                        send(out, ack);
                        broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"MOVE_FROM_HALLWAY\",\"gameId\":\"" + esc(gameId) + "\",\"playerId\":\"" + esc(playerId) + "\",\"room\":\"" + esc(room) + "\",\"state\":" + stateJson + "}", out);
                    } else {
                        send(out, "{\"type\":\"ERROR\",\"message\":\"Illegal hallway exit\"}");
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

                    SuggestionResult res = engine.handleSuggestionDetailed(playerId, suspect, weapon, room);
                    if (res.isAccepted()) {
                        String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
                        // Private ACK to suggester includes revealedCard (if any) and disprover
                        String ack = "{\"type\":\"ACK\",\"for\":\"SUGGEST\",\"gameId\":\"" + esc(gameId) +
                                "\",\"playerId\":\"" + esc(playerId) + "\",\"suspect\":\"" + esc(suspect) +
                                "\",\"weapon\":\"" + esc(weapon) + "\",\"room\":\"" + esc(room) +
                                "\",\"disprover\":\"" + (res.getDisprover() == null ? "" : esc(res.getDisprover())) +
                                "\",\"revealedCard\":\"" + (res.getRevealedCard() == null ? "" : esc(res.getRevealedCard())) +
                                "\",\"state\":" + stateJson + "}";
                        send(out, ack);

                        // Public broadcast without the revealed card content
                        String pub = "{\"type\":\"EVENT\",\"event\":\"SUGGEST\",\"gameId\":\"" + esc(gameId) +
                                "\",\"playerId\":\"" + esc(playerId) + "\",\"suspect\":\"" + esc(suspect) +
                                "\",\"weapon\":\"" + esc(weapon) + "\",\"room\":\"" + esc(room) +
                                "\",\"disprover\":\"" + (res.getDisprover() == null ? "" : esc(res.getDisprover())) +
                                "\",\"state\":" + stateJson + "}";
                        broadcast(gameId, pub, out);
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
                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
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
                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
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

                    // Deal cards and set hidden solution
                    engine.startGame();

                    String stateJson = JsonUtil.toJson(buildSnapshot(engine.getGameState(), engine.getBoard()));
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
        return buildSnapshot(gs, null);
    }

    private static Map<String, Object> buildSnapshot(GameState gs, Board board) {
        Map<String, Object> root = new LinkedHashMap<>();
        List<Map<String, Object>> players = new ArrayList<>();
        for (Player p : gs.getPlayers().values()) {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("name", p.getName());
            pm.put("character", p.getCharacterName());
            pm.put("room", p.getCurrentRoom() != null ? p.getCurrentRoom().getName() : null);
            if (p.getLocation() instanceof Board.Hallway) {
                Board.Hallway h = (Board.Hallway) p.getLocation();
                Map<String, Object> loc = new LinkedHashMap<>();
                loc.put("type", "HALLWAY");
                loc.put("name", h.getId());
                pm.put("location", loc);
            } else if (p.getCurrentRoom() != null) {
                Map<String, Object> loc = new LinkedHashMap<>();
                loc.put("type", "ROOM");
                loc.put("name", p.getCurrentRoom().getName());
                pm.put("location", loc);
            } else {
                pm.put("location", null);
            }
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

        if (board != null) {
            List<Map<String, Object>> hallways = new ArrayList<>();
            for (Board.Hallway h : new LinkedHashMap<>(board.getHallways()).values()) {
                // de-duplicate: only include canonical ids where id equals getName()
                if (!h.getName().contains("_")) continue; // defensive; all ids contain _
                // only include once by requiring a.getName() < b.getName()
                String[] parts = h.getName().split("_");
                if (parts.length == 2) {
                    String a = parts[0], b = parts[1];
                    if (a.compareTo(b) > 0) continue; // skip reverse
                }
                Map<String, Object> hm = new LinkedHashMap<>();
                hm.put("id", h.getName());
                hm.put("a", h.getA().getName());
                hm.put("b", h.getB().getName());
                hm.put("occupant", h.getOccupant() != null ? h.getOccupant().getName() : null);
                hallways.add(hm);
            }
            root.put("hallways", hallways);
        }
        root.put("currentPlayer", gs.getCurrentPlayer() != null ? gs.getCurrentPlayer().getName() : null);
        root.put("gameOver", gs.isGameOver());
        root.put("winner", gs.getWinner());
        return root;
    }

    private static Map<String, Object> buildLobbySnapshot(Lobby lobby) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("gameId", lobby.getGameId());
        root.put("started", lobby.isStarted());

        List<String> players = new ArrayList<>(lobby.getPlayers());
        root.put("players", players);

        Map<String, String> selections = new LinkedHashMap<>(lobby.getSelections());
        root.put("selections", selections);

        root.put("available", new ArrayList<>(lobby.getAvailableCharacters()));
        root.put("ready", new LinkedHashMap<>(lobby.getReadyMap()));
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