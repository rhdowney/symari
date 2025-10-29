# Player Move Sequence (TCP -> Server)

This diagram complements docs/move-logic.md and shows the end-to-end flow for a MOVE request.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CH as ClientHandler
    participant MR as MessageRouter
    participant MV as MessageValidator
    participant GE as GameEngine
    participant MH as MoveHandler
    participant RV as RuleValidator
    participant GS as GameState
    participant P as Player
    participant R as Room

    Note over C,CH: Connection already established (TCP).<br/>Messages are line-delimited JSON.

    C->>CH: JSON line: ClientMessage{ type: MOVE, correlationId, gameId, playerId, payload{ targetRoom } }
    CH->>MR: route(clientId, msg, out)
    MR->>MV: validate(msg)
    alt invalid message
        MV-->>MR: throws IllegalArgumentException
        MR-->>CH: ServerMessage.error("INVALID", reason)
        CH-->>C: JSON line (error)
        return
    else valid
        MV-->>MR: ok
    end

    MR->>GE: handleMove(gameId, playerId, payload)
    GE->>MH: handleMove(playerId, targetRoomName)

    MH->>GS: getPlayer(playerId)
    MH->>GS: getRoom(targetRoomName)
    alt first placement (player.currentRoom == null)
        MH->>P: setCurrentRoom(targetRoom)
        MH->>R: addOccupant(player)
        MH-->>GE: { accepted: true, firstPlacement: true }
    else subsequent move
        MH->>RV: canMove(player, targetRoom)?
        alt allowed
            MH->>R: removeOccupant(player) [from currentRoom]
            MH->>P: setCurrentRoom(targetRoom)
            MH->>R: addOccupant(player)
            MH-->>GE: { accepted: true }
        else disallowed
            MH-->>GE: { accepted: false, reason }
        end
    end

    GE-->>MR: result Map
    MR-->>CH: ServerMessage.ok("MOVE_ACK").withCorrelationId(...).withPayload(result)
    CH-->>C: JSON line (ok)

    Note over C,CH: Client pairs response via correlationId.
```