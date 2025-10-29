# Clue-Less Server

A Java (Maven) TCP server for a networked, multiplayer Clue game. Clients send line-delimited JSON; the server validates, routes, and replies with structured JSON.

## Overview

- Transport: plain TCP sockets (one line = one JSON message).
- Parsing: JsonUtil (Jackson/Gson wrapper) converts JSON ↔ DTOs.
- Flow: Client -> ClientHandler -> MessageValidator -> MessageRouter -> GameEngine -> ServerMessage -> Client.

```
Client JSON ──> ClientHandler ──> JsonUtil.fromJson(ClientMessage)
                    │
                    ▼
            MessageValidator (basic checks)
                    │
                    ▼
             MessageRouter (dispatch)
                    │
                    ▼
              GameEngine (stubs/logic)
                    │
                    ▼
      ServerMessage -> JsonUtil.toJson -> socket
```

## Build and Run

- Build (Windows PowerShell):
  - cd clueless-server
  - mvn -q -DskipTests package
- Run:
  - Preferred: launch App (entrypoint) from VS Code or:
    - java -cp target/classes edu.jhu.clueless.App
  - Direct server (if main method present in ClueServer):
    - java -cp target/classes edu.jhu.clueless.network.ClueServer

Default port is defined in code (see App/ClueServer). Adjust there or via your config loader if wired.

## Quick connectivity test (Windows PowerShell)

```
$client = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 5000)
$stream = $client.GetStream()
$w = New-Object System.IO.StreamWriter($stream); $w.AutoFlush = $true
$r = New-Object System.IO.StreamReader($stream)

# JOIN
$w.WriteLine('{"type":"JOIN","correlationId":"c1","gameId":"g1","playerId":"p1","payload":{}}')
$r.ReadLine()

# CHAT
$w.WriteLine('{"type":"CHAT","correlationId":"c2","playerId":"p1","payload":{"text":"Hello"}}')
$r.ReadLine()

# HEARTBEAT
$w.WriteLine('{"type":"HEARTBEAT","correlationId":"c3","payload":{}}')
$r.ReadLine()

$w.Dispose(); $r.Dispose(); $client.Close()
```

## Message formats

- ClientMessage (input):
  - type: enum (JOIN, MOVE, SUGGESTION, ACCUSATION, CHAT, HEARTBEAT)
  - correlationId: string (pairs request/response)
  - gameId: string (optional for JOIN)
  - playerId: string
  - payload: object (type-specific fields)

- ServerMessage (output):
  - status: "ok" | "error"
  - event: e.g., "JOIN_ACK", "MOVE_ACK", "CHAT_ACK"
  - correlationId: mirrors request
  - payload: object (type-specific)
  - errorCode, errorMessage: when status="error"

- ErrorMessage, GameStateUpdate: DTOs for errors and broadcast/updates.

## Package and file responsibilities

- edu.jhu.clueless.App
  - Inputs: none (process args/config if added)
  - Outputs: starts server; logs
  - Responsibility: application entrypoint; constructs/wires ClueServer (and dependencies)


- edu.jhu.clueless.network

  - ClueServer.java
    - Inputs: port; accepts Socket connections
    - Outputs: spawns ClientHandler per connection
    - Responsibility: TCP listener, thread pool, lifecycle

  - ClientHandler.java
    - Inputs: a connected Socket; line-delimited JSON
    - Outputs: parsed ClientMessage -> MessageRouter; ServerMessage JSON to socket
    - Responsibility: per-client I/O loop, parse/route/write

  - MessageRouter.java
    - Inputs: ClientMessage; PrintWriter (client)
    - Outputs: ServerMessage JSON responses; calls into GameEngine
    - Responsibility: validate, switch by MessageType, call engine stubs/logic

  - MessageValidator.java
    - Inputs: ClientMessage
    - Outputs: throws on invalid message
    - Responsibility: minimal structural checks (type, correlationId, per-type fields)

  - MessageType.java
    - Inputs: n/a
    - Outputs: enum values
    - Responsibility: canonical set of message types (JOIN, MOVE, SUGGESTION, ACCUSATION, CHAT, HEARTBEAT)

  - Message.java
    - Inputs/Outputs: shared message utilities or base model (if used)
    - Responsibility: common message helpers (if referenced)

  - WsBridgeServer.java
    - Inputs: WebSocket connections (future)
    - Outputs: bridges to TCP or directly to router
    - Responsibility: WebSocket facade/bridge (optional path for browser clients)


- edu.jhu.clueless.network.dto

  - ClientMessage.java
    - Inputs: JSON from client
    - Outputs: typed object for routing
    - Responsibility: input DTO (type, correlationId, gameId, playerId, payload)

  - ServerMessage.java
    - Inputs: data from router/engine
    - Outputs: JSON to client
    - Responsibility: output DTO with helpers (ok/error, payload)

  - ErrorMessage.java
    - Inputs: error details
    - Outputs: error JSON
    - Responsibility: standardized error payload

  - GameStateUpdate.java
    - Inputs: snapshots from GameEngine
    - Outputs: broadcast/update JSON
    - Responsibility: push current state to clients

- edu.jhu.clueless.engine

  - GameEngine.java
    - Inputs: high-level actions (join/move/suggest/accuse)
    - Outputs: result maps/state updates
    - Responsibility: core game rules/state transitions (currently stubs for rapid I/O testing)

  - GameManager.java
    - Inputs: game/session operations
    - Outputs: created/managed sessions
    - Responsibility: multi-game orchestration

  - GameState.java
    - Inputs: mutations via engine/handlers
    - Outputs: serializable state
    - Responsibility: full game board state

  - MoveHandler.java, SuggestionHandler.java, RuleValidator.java
    - Inputs: player actions and state
    - Outputs: validated/resolved results
    - Responsibility: enforce movement/suggestion rules
    
  - Player.java, Room.java, Weapon.java, Passageway.java, Suggestion.java, Card.java, Solution.java
    - Inputs: data for state
    - Outputs: typed domain objects
    - Responsibility: domain model

- edu.jhu.clueless.exceptions

  - GameNotFoundException.java, PlayerNotFoundException.java, InvalidMessageException.java
    - Inputs: error conditions
    - Outputs: typed exceptions
    - Responsibility: explicit error signaling


- edu.jhu.clueless.interfaces

  - IGameEventListener.java
    - Inputs: game events
    - Outputs: callbacks
    - Responsibility: hook for observing engine events (e.g., for UI/broadcast)

  - IMessageHandler.java
    - Inputs: messages (intended contract)
    - Outputs: handling contract
    - Responsibility: interface for message handling (consider converting to interface if currently a class)


- edu.jhu.clueless.util

  - JsonUtil.java
    - Inputs: objects/JSON strings
    - Outputs: JSON strings/objects
    - Responsibility: serialize/deserialize

  - ConfigLoader.java
    - Inputs: config files/env (if used)
    - Outputs: config values
    - Responsibility: central configuration

  - LoggerUtil.java
    - Inputs: log messages
    - Outputs: formatted logs
    - Responsibility: logging helpers

## Current capabilities

- Accepts multiple TCP clients.
- Parses ClientMessage and validates basic fields.
- Routes by MessageType and sends ServerMessage replies (ACKs for JOIN/CHAT/HEARTBEAT).
- Engine methods can be stubbed; game logic can be added incrementally.

## Next steps

- Add broadcast registry to send GameStateUpdate to all players in a game.
- Implement real rule checks in GameEngine and per-type routing in MessageRouter.
- Expand MessageValidator with stronger per-type validations.
- Optional: enable WsBridgeServer for browser clients.