package edu.jhu.clueless.network;

import edu.jhu.clueless.engine.GameEngine;
import com.google.gson.Gson;


public class MessageRouter {

    private GameEngine engine; 
    private Gson gson = new Gson();

    public MessageRouter(GameEngine engine){
        this.engine = engine;
    }

    // entry point for JSON messages

    public void handleMessage(String json){
        Map<String, Object> msg = gson.fromJson(json,Map.class);
        String type = (String) msg.get("type");

        switch(type){
            case "move":
                engine.handleMove(
                    (String) msg.get("player"),
                    (String) msg.get("room")
                );
                break;

            case "suggest":
                engine.handleSuggestion(
                    (String) msg.get("player"),
                    (String) msg.get("suspect"),
                    (String) msg.get("weapon"),
                    (String) msg.get("room")
                );
                break;

            default:
                System.out.println("[ROUTER] Unknown message type: " + type);
        }
    }
}
