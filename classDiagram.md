```mermaid
classDiagram
    %% Domain / engine classes
    class Room {
      - String name
      - List~Player~ occupants
      - List~Room~ connectedRooms
      + Room(String name)
      + void connect(Room other)
      + String getName()
      + List~Room~ getConnectedRooms()
      + List~Player~ getOccupants()
      + void addOccupant(Player p)
      + void removeOccupant(Player p)
    }

    class Player {
      - String name
      - String character
      - Room currentRoom
      - boolean active
      - boolean movedThisTurn
      - boolean suggestedThisTurn
      + Player(String name, String character)
      + String getName()
      + String getCharacter()
      + Room getCurrentRoom()
      + void setCurrentRoom(Room r)
      + boolean isActive()
      + void deactivate()
      + void resetTurnFlags()
      + void setMovedThisTurn(boolean b)
      + void setSuggestedThisTurn(boolean b)
    }

    class Weapon {
      - String name
      - Room location
      + Weapon(String name)
      + String getName()
      + Room getLocation()
      + void setLocation(Room location)
    }

    class Card {
      + enum Type { CHARACTER, WEAPON, ROOM }
      - String name
      - Type type
      + Card(String name, Type type)
      + String getName()
      + Type getType()
    }

    class Solution {
      - String suspect
      - String weapon
      - String room
      + Solution(String suspect, String weapon, String room)
      + String getSuspect()
      + String getWeapon()
      + String getRoom()
    }

    class GameState {
      - Map~String,Player~ players
      - Map~String,Room~ rooms
      - Solution solution
      - String currentPlayerName
      - boolean gameOver
      - String winner
      + GameState()
      + Player getPlayer(String name)
      + Room getRoom(String name)
      + void addPlayer(Player p)
      + void addRoom(Room r)
      + Map~String,Player~ getPlayers()
      + Map~String,Room~ getRooms()
      + Solution getSolution()
      + void setSolution(Solution s)
      + Player getCurrentPlayer()
      + void setCurrentPlayer(Player p)
      + void nextTurn()
      + boolean isGameOver()
      + void setGameOver(boolean b)
      + String getWinner()
      + void setWinner(String name)
    }

    class MoveHandler {
      - GameState gameState
      + MoveHandler(GameState gameState)
      + boolean handleMove(String playerName, String targetRoomName)
    }

    class RuleValidator {
      + static boolean canMove(Player p, Room r)
      + static boolean canSuggest(Player p)
    }

    class Suggestion {
      - String suggester
      - String suspect
      - String weapon
      - String room
      + Suggestion(String suggester, String suspect, String weapon, String room)
      + getters...
    }

    class SuggestionHandler {
      - GameState gameState
      + SuggestionHandler(GameState gameState)
      + void handleSuggestion(Suggestion s)
    }

    class AccusationResult {
      - boolean acknowledged
      - boolean endedGame
      - String winner
      - boolean playerEliminated
      + AccusationResult(boolean ack, boolean endedGame, String winner, boolean eliminated)
      + getters...
    }

    class GameEngine {
      - GameState gameState
      - MoveHandler moveHandler
      - SuggestionHandler suggestionHandler
      + GameEngine(GameState gameState)
      + Player joinPlayer(String playerName, String characterName)
      + boolean isPlayersTurn(String playerName)
      + boolean handleMove(String player, String room)
      + boolean handleSuggestion(String playerName, String suspect, String weapon, String room)
      + void advanceTurn()
      + AccusationResult handleAccusation(String playerName, String suspect, String weapon, String room)
      + GameState getGameState()
    }

    class GameManager {
      %% orchestrates multiple GameEngine instances (placeholder in repo)
    }

    %% Network / messaging classes
    class ClientMessage {
      - String type
      - String gameId
      - String playerId
      - Map~String,Object~ payload
      + getters/setters...
    }

    class ServerMessage {
      - String status
      - String event
      - String correlationId
      - Map~String,Object~ payload
      - String errorCode
      - String errorMessage
      + ServerMessage()
      + static ServerMessage ok(String event)
      + static ServerMessage error(String code, String message)
      + ServerMessage withCorrelationId(String correlationId)
      + ServerMessage withPayload(String key, Object value)
      + ServerMessage withPayload(Map~String,Object~ map)
      + getters / setters...
    }

    class MessageRouter {
      - Map~String,GameEngine~ engines
      - Map~String,Set~ joined
      + MessageRouter()
      + void route(String clientId, ClientMessage msg, PrintWriter out)
      + GameEngine getOrCreateEngine(String gameId)
    }

    class ClientHandler {
      - Socket socket
      - MessageRouter router
      + ClientHandler(Socket socket, MessageRouter router)
      + void run()
    }

    class WsBridgeServer {
      - MessageRouter router
      - Map~WebSocket,String~ ids
      + WsBridgeServer(int port, MessageRouter router)
      + void onStart()
      + void onOpen(WebSocket conn, ClientHandshake handshake)
      + void onClose(WebSocket conn, int code, String reason, boolean remote)
      + void onMessage(WebSocket conn, String message)
      + void onError(WebSocket conn, Exception ex)
    }

    class ClueServer {
      - int port
      - MessageRouter router
      - ExecutorService pool
      + ClueServer(int port, MessageRouter router)
      + void start()
      + void run()
    }

    enum MessageType {
      PING
      JOIN
      MOVE
      SUGGEST
      ACCUSE
      END_TURN
      NEW_GAME
    }

    class JsonUtil {
      + static String toJson(Object obj)
      + static <T> T fromJson(String json, Class~T~ clazz)
    }

    %% Associations / relationships
    Room "1" o-- "*" Player : occupants
    Room "1" -- "*" Room : connectedRooms
    Player --> Room : currentRoom
    Weapon --> Room : location
    MoveHandler --> GameState : uses
    MoveHandler ..> Player : accesses
    MoveHandler ..> Room : accesses
    RuleValidator ..> Player : uses
    RuleValidator ..> Room : uses
    SuggestionHandler --> GameState : uses
    SuggestionHandler ..> Suggestion : handles
    GameEngine --> GameState : manages
    GameEngine --> MoveHandler : contains
    GameEngine --> SuggestionHandler : contains
    GameManager ..> GameEngine : orchestrates
    MessageRouter --> GameEngine : getOrCreateEngine
    MessageRouter ..> ClientMessage : receives
    MessageRouter ..> ServerMessage : sends
    ClueServer --> MessageRouter : router
    WsBridgeServer --> MessageRouter : router
    ClueServer ..> ClientHandler : spawns
    ClientHandler ..> MessageRouter : uses
    ServerMessage ..> Card : may carry card lists (payload)
```
