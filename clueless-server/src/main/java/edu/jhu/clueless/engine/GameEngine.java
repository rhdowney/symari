package edu.jhu.clueless.engine;

import java.util.Arrays;
import java.util.List;

public class GameEngine {

    private final GameState gameState;
    private final MoveHandler moveHandler;
    private final SuggestionHandler suggestionHandler;
    private final Board board;

    public GameEngine(GameState gameState) {
        this.gameState = gameState != null ? gameState : new GameState();
        this.board = Board.standard();
        this.moveHandler = new MoveHandler(this.gameState, this.board);
        this.suggestionHandler = new SuggestionHandler(this.gameState); // adjust if needed
        ensureBoardInitialized();
    }

    private void ensureBoardInitialized() {
        if (gameState.getRooms().isEmpty()) {
            // Populate rooms and connections from the canonical board definition
            board.applyTo(gameState);
        }
        // Solution will be initialized by startGame() when dealing
    }

    public void startGame() {
        GameManager.setupAndDeal(this.gameState, this.board);
        // Ensure a current player is set
        if (gameState.getCurrentPlayer() == null) {
            for (Player p : gameState.getPlayers().values()) { if (p.isActive()) { gameState.setCurrentPlayer(p); break; } }
        }
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
        // Ensure the suggestion is made from the specified room
        if (p.getCurrentRoom() == null || room == null || !p.getCurrentRoom().getName().equalsIgnoreCase(room)) return false;
        SuggestionResult res = this.suggestionHandler.handleSuggestion(playerName, suspect, weapon, room);
        if (!res.isAccepted()) return false;
        p.setSuggestedThisTurn(true);
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
    public Board getBoard() { return board; }

    // New optional hallway-aware movement APIs
    public boolean handleMoveToHallway(String playerName, String hallwayId) {
        boolean ok = moveHandler.handleMoveToHallway(playerName, hallwayId);
        // Do not set movedThisTurn here; allow exiting hallway to complete the move this turn
        return ok;
    }

    public boolean handleMoveFromHallwayToRoom(String playerName, String targetRoomName) {
        boolean ok = moveHandler.handleMoveFromHallwayToRoom(playerName, targetRoomName);
        if (ok) {
            Player p = gameState.getPlayer(playerName);
            if (p != null) p.setMovedThisTurn(true);
        }
        return ok;
    }

    // Detailed suggestion path for router, returns structured result
    public SuggestionResult handleSuggestionDetailed(String playerName, String suspect, String weapon, String room) {
        Player p = gameState.getPlayer(playerName);
        if (p == null) return new SuggestionResult(false, playerName, suspect, weapon, room, null, null);
        if (!RuleValidator.canSuggest(p)) return new SuggestionResult(false, playerName, suspect, weapon, room, null, null);
        if (p.getCurrentRoom() == null || room == null || !p.getCurrentRoom().getName().equalsIgnoreCase(room))
            return new SuggestionResult(false, playerName, suspect, weapon, room, null, null);

        SuggestionResult res = this.suggestionHandler.handleSuggestion(playerName, suspect, weapon, room);
        if (res.isAccepted()) p.setSuggestedThisTurn(true);
        return res;
    }
}
