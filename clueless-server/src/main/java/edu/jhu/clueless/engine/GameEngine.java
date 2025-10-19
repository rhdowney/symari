package edu.jhu.clueless.engine;

import java.util.Arrays;
import java.util.List;

public class GameEngine {

    private final GameState gameState;
    private final MoveHandler moveHandler;
    private final SuggestionHandler suggestionHandler;

    public GameEngine(GameState gameState) {
        this.gameState = gameState != null ? gameState : new GameState();
        this.moveHandler = new MoveHandler(this.gameState);
        this.suggestionHandler = new SuggestionHandler(this.gameState); // adjust if needed
        ensureBoardInitialized();
    }

    private void ensureBoardInitialized() {
        if (!gameState.getRooms().isEmpty()) {
            if (gameState.getSolution() == null) {
                gameState.setSolution(new Solution("GREEN", "ROPE", "HALL"));
            }
            return;
        }
        List<String> names = Arrays.asList("HALL","LOUNGE","STUDY","LIBRARY","BILLIARD","CONSERVATORY","BALLROOM","KITCHEN","DINING");
        for (String n : names) if (gameState.getRoom(n) == null) gameState.addRoom(new Room(n));
        connect("HALL","LOUNGE");         connect("HALL","STUDY");
        connect("LOUNGE","DINING");       connect("LOUNGE","CONSERVATORY");
        connect("STUDY","LIBRARY");       connect("STUDY","KITCHEN");
        connect("LIBRARY","BILLIARD");
        connect("BILLIARD","CONSERVATORY"); connect("BILLIARD","DINING");
        connect("CONSERVATORY","BALLROOM");
        connect("BALLROOM","KITCHEN");
        connect("KITCHEN","DINING");

        gameState.setSolution(new Solution("GREEN", "ROPE", "HALL")); // hidden
    }

    private void connect(String a, String b) {
        Room ra = gameState.getRoom(a), rb = gameState.getRoom(b);
        if (ra != null && rb != null) ra.connect(rb);
    }

    public Player joinPlayer(String playerName, String characterName) {
        Player p = gameState.getPlayer(playerName);
        if (p == null) {
            p = new Player(playerName, characterName != null ? characterName : playerName);
            gameState.addPlayer(p);
            if (gameState.getCurrentPlayer() == null) gameState.setCurrentPlayer(p);
        }
        return p;
    }

    public boolean isPlayersTurn(String playerName) {
        Player cp = gameState.getCurrentPlayer();
        return cp != null && cp.getName().equals(playerName);
    }

    public boolean handleMove(String player, String room) {
        boolean ok = moveHandler.handleMove(player, room);
        if (ok) {
            Player p = gameState.getPlayer(player);
            if (p != null) p.setMovedThisTurn(true);
        }
        return ok;
    }

    public boolean handleSuggestion(String playerName, String suspect, String weapon, String room) {
        Player p = gameState.getPlayer(playerName);
        if (p == null) return false;
        if (!RuleValidator.canSuggest(p)) return false;
        if (p.getCurrentRoom() == null || room == null || !p.getCurrentRoom().getName().equalsIgnoreCase(room)) return false;
        // TODO: invoke SuggestionHandler
        p.setSuggestedThisTurn(true);
        // advance turn automatically if you prefer:
        // gameState.nextTurn();
        return true;
    }

    public void advanceTurn() {
        gameState.nextTurn();
        Player cp = gameState.getCurrentPlayer();
        if (cp != null) cp.resetTurnFlags();
    }

    public AccusationResult handleAccusation(String playerName, String suspect, String weapon, String room) {
        if (gameState.isGameOver()) {
            return new AccusationResult(true, true, gameState.getWinner(), false);
        }
        Player p = gameState.getPlayer(playerName);
        if (p == null) return new AccusationResult(false, false, null, false);

        Solution s = gameState.getSolution();
        boolean correct = s != null
            && s.getSuspect().equalsIgnoreCase(suspect)
            && s.getWeapon().equalsIgnoreCase(weapon)
            && s.getRoom().equalsIgnoreCase(room);

        if (correct) {
            gameState.setGameOver(true);
            gameState.setWinner(playerName);
            return new AccusationResult(true, true, playerName, false);
        } else {
            p.deactivate();

            // If only one active player remains, they win immediately
            int active = 0; String lastActive = null;
            for (Player pl : gameState.getPlayers().values()) {
                if (pl.isActive()) { active++; lastActive = pl.getName(); }
            }
            if (active <= 1) {
                gameState.setGameOver(true);
                gameState.setWinner(lastActive);
                return new AccusationResult(false, true, lastActive, true);
            }

            if (isPlayersTurn(playerName)) gameState.nextTurn();
            return new AccusationResult(false, false, null, true);
        }
    }

    public GameState getGameState() { return gameState; }
}
