classDiagram
    %% Server / engine domain classes
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
        - Room currentRoom
        + String getName()
        + Room getCurrentRoom()
        + void setCurrentRoom(Room r)
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
        + Player getPlayer(String name)
        + Room getRoom(String name)
        %% (serializable game snapshot & accessors; methods inferred from usages)
    }

    class MoveHandler {
        - GameState gameState
        + MoveHandler(GameState gameState)
        + boolean handleMove(String playerName, String targetRoomName)
    }

    class RuleValidator {
        + static boolean canMove(Player p, Room r)
    }

    class GameEngine {
        %% core engine (methods & lists omitted/stubbed in repo)
    }

    class GameManager {
        %% manager for multiple games (empty / placeholder in repo)
    }

    %% Network / messaging classes
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

    class MessageRouter {
        %% central router referenced by servers; routes ClientMessage -> handlers
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
    GameEngine ..> GameState : manages
    GameManager ..> GameEngine : orchestrates
    WsBridgeServer --> MessageRouter : router
    ClueServer --> MessageRouter : router
    WsBridgeServer ..> ServerMessage : builds/sends
    ServerMessage ..> Card : may carry card lists (payload)
