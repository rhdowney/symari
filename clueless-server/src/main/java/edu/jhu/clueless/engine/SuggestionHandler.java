package edu.jhu.clueless.engine;

public class SuggestionHandler {
    
    private GameState gameState; 

    public SuggestionHandler(GameState gameState){
        this.gameState = gameState;
    }

    public void handleSuggestion(String playerName, String suspect, String weapon, String room){
        Player player = gameState.getPlayer(playerName);

        if(!RuleValidator.canSuggest(player)){
            System.out.println("[SUGGEST] Invalid suggestion - player not in a room");
            return;
        }

        System.out.println("[SUGGEST] " + player.getName() + " suggests it was " + suspect + " with the " + weapon + " in the " + room);

        // will add triggers for disproving here

    }
}
