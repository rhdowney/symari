# Player Join Lobby Logic (Server)

This document explains the server-side logic when a player joins a game lobby via a JOIN message.

## Inputs
- playerId: unique identifier for the joining player (required).
- gameId: target game/lobby identifier (optional; if absent, use default or create).
- correlationId: request/response pairing token (required).
- payload: optional fields (e.g., displayName).

## Primary Components
- ClientHandler
  - Reads a JSON line from the socket and parses into ClientMessage.
- MessageValidator
  - Ensures required fields exist (type, correlationId, playerId).
- MessageRouter
  - Switches on MessageType.JOIN, calls engine, and writes ServerMessage back.
  - Optionally registers the client for future broadcasts for that game.
- GameEngine (and/or GameManager)
  - Creates/maintains game sessions and player membership.
  - Returns a summary (gameId, playerId, players) for the response payload.
- GameState (under the engine)
  - Holds current players and state of the game.
- ServerMessage
  - Outbound DTO for replies (JOIN_ACK or error).

## Step-by-Step Flow

1) Receive and parse
- Client sends a line-delimited JSON: ClientMessage{ type: "JOIN", correlationId, playerId, gameId?, payload? }.
- ClientHandler parses it via JsonUtil.fromJson and forwards to MessageRouter.route(clientId, msg, out).

2) Validate
- MessageValidator checks:
  - type is present and equals JOIN.
  - correlationId is non-blank.
  - playerId is non-blank.

3) Route and register
- MessageRouter handles JOIN:
  - Determine effective gameId (use provided or default/create).
  - Ensure a GameEngine instance exists for that game (create if first join).
  - Call engine.joinGame(gameId, playerId, payload) to register the player.
  - Optionally: record clientId -> gameId and keep the client’s PrintWriter for broadcasts to this game.

4) Respond
- Build ServerMessage.ok("JOIN_ACK")
  - withCorrelationId(correlationId)
  - withPayload("gameId", gameId)
  - withPayload("playerId", playerId)
  - optionally withPayload("players", [...]) or a compact state summary.
- Serialize with JsonUtil.toJson and write the line to the client socket.

5) Optional broadcast
- If desired, broadcast a GameStateUpdate to all subscribers of the game to reflect the new player list.

## Side Effects
- Mutates game session membership (adds the player to the game).
- Optionally registers the client for future game broadcasts.

## Failure Modes (send ServerMessage.error)
- INVALID: missing type/correlationId/playerId or malformed JSON.
- PLAYER_EXISTS: playerId already in the session (if enforced).
- GAME_FULL: lobby capacity reached (if enforced).
- UNEXPECTED: other server errors.

## Assumptions and Responsibilities
- Client sends one JSON message per line over TCP.
- correlationId allows the client to correlate replies.
- GameEngine is the single source of truth for players and sessions.

## Pseudocode

```
on JOIN:
  validate(type, correlationId, playerId)
  effectiveGameId = msg.gameId or "default"
  engine = engines.computeIfAbsent(effectiveGameId, new GameEngine())
  summary = engine.joinGame(effectiveGameId, playerId, msg.payload)
  subscribers[effectiveGameId].add(clientWriter)     # optional
  reply = ServerMessage.ok("JOIN_ACK")
            .withCorrelationId(msg.correlationId)
            .withPayload(summary)
  send(reply)

  # optional broadcast
  # broadcast(effectiveGameId, GameStateUpdate(engine.getStateSummary(effectiveGameId)))
```

## Example Messages

Client -> Server (JOIN)
```
{"type":"JOIN","correlationId":"c1","gameId":"g1","playerId":"p1","payload":{"displayName":"Alice"}}
```

Server -> Client (JOIN_ACK)
```
{"status":"ok","event":"JOIN_ACK","correlationId":"c1","payload":{"gameId":"g1","playerId":"p1","players":["p1"]}}
```