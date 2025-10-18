package edu.jhu.clueless.engine;

public class GameEngine {
    
    private GameState gameState; 
    private MoveHandler moveHandler; 
    private SuggestionHandler suggestionHandler;

    public GameEngine(GameState gameState) {
        this.gameState = gameState;
        this.moveHandler = new MoveHandler(gameState);
        this.suggestionHandler = new SuggestionHandler(gameState);
    }

    public void handleMove(String player, String room){
        boolean success = moveHandler.handleMove(player, room);
        if(!success){
            System.out.println("[ENGINE] Move failed for " + player + " -> " + room);
        }
    }

    public void handleSuggestion(String player, String suspect, String weapon, String room){
        suggestionHandler.handleSuggestion(player, suspect, weapon, room);
    }

    public GameState getGameState(){
        return gameState;
    }

}
