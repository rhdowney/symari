# Player Move Logic (Server)

This document explains the server-side logic that runs when a player attempts to move, based on `MoveHandler.handleMove(String playerName, String targetRoomName)`.

## Inputs
- playerName: unique name/id of the player requesting the move.
- targetRoomName: name/id of the room the player wants to move to.

## Primary Components
- GameState
  - Provides access to players and rooms (`getPlayer`, `getRoom`).
  - Tracks current room occupancy.
- Player
  - Holds the player’s current location (`getCurrentRoom`, `setCurrentRoom`).
- Room
  - Tracks who is in the room (`addOccupant`, `removeOccupant`).
- RuleValidator
  - Enforces movement rules (`canMove(player, targetRoom)`).
- MoveHandler
  - Orchestrates the move flow and mutates state if valid.

## Step-by-Step Flow

1) Lookup entities
- Fetch Player by playerName via GameState.getPlayer.
- Fetch Room by targetRoomName via GameState.getRoom.
- If either is null, return false (invalid request).

2) First placement (no rule checks)
- If player.getCurrentRoom() == null:
  - player.setCurrentRoom(targetRoom)
  - targetRoom.addOccupant(player)
  - Log: [MOVE] <player> placed in <room>
  - Return true
- Rationale: First placement is a setup step; rules don’t apply yet.

3) Validate movement rules
- For subsequent moves, verify RuleValidator.canMove(player, targetRoom).
- If canMove is false, return false (move rejected).

4) Apply state changes (on valid move)
- Let currentRoom = player.getCurrentRoom()
- If currentRoom != null: currentRoom.removeOccupant(player)
- player.setCurrentRoom(targetRoom)
- targetRoom.addOccupant(player)
- Log: [MOVE] <player> moved to <room>
- Return true

## Side Effects
- Mutates Player.currentRoom.
- Updates Room occupancy lists (remove from old, add to new).
- Prints a log line for observability.

## Failure Modes (returns false)
- Unknown player or room (null lookups).
- Movement disallowed by RuleValidator.canMove.
- Note: There is no explicit same-room short-circuit; RuleValidator should handle “no-op” or disallow as needed.

## Assumptions and Responsibilities
- GameState contains consistent Player and Room instances.
- RuleValidator.canMove encapsulates all board rules (adjacency, passages, turn order, etc.).
- Room.addOccupant/removeOccupant keep occupancy sets consistent and idempotent.

## Pseudocode (mirrors MoveHandler)

```
handleMove(playerName, targetRoomName):
  player = gameState.getPlayer(playerName)
  target = gameState.getRoom(targetRoomName)
  if player == null or target == null:
    return false

  if player.currentRoom == null:
    player.currentRoom = target
    target.addOccupant(player)
    log "[MOVE] placed"
    return true

  if not RuleValidator.canMove(player, target):
    return false

  current = player.currentRoom
  if current != null:
    current.removeOccupant(player)

  player.currentRoom = target
  target.addOccupant(player)
  log "[MOVE] moved"
  return true
```

## Integration Notes
- Typical call path (TCP): Client sends MOVE JSON -> ClientHandler -> MessageRouter -> GameEngine/MoveHandler -> boolean result -> ServerMessage MOVE_ACK with result.
- For UI updates, broadcast a GameStateUpdate after a successful move (not shown in MoveHandler; done by routing/broadcast layer).