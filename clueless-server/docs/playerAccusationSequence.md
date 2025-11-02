# Player Accusation Sequence (TCP -> Server)

```mermaid
sequenceDiagram
    autonumber
    participant C as Accuser(Client)
    participant CH as ClientHandler
    participant MR as MessageRouter
    participant MV as MessageValidator
    participant GE as GameEngine
    participant AH as AccusationHandler
    participant GS as GameState
    participant Subs as Subscribers (all players)

    Note over C,CH: Client sends ACCUSATION JSON line

    C->>CH: ClientMessage(ACCUSATION)
    CH->>MR: route(clientId,msg,out)
    MR->>MV: validate(msg)
    alt invalid
        MV-->>MR: throws IllegalArgumentException
        MR-->>CH: ServerMessage.error("INVALID", reason)
        CH-->>C: JSON line (error)
    else valid
        MV-->>MR: ok
    end

    MR->>GE: handleAccusation(gameId, playerId, suspect, weapon, room)
    GE->>AH: resolveAccusation(playerId, suspect, weapon, room)
    AH->>GS: compare with solution
    alt correct
        AH-->>GE: { correct: true, solution: {...} }
        GE-->>MR: result(correct:true, winner:playerId, solution)
        MR-->>Subs: ServerMessage.ok("ACCUSATION_PUBLIC").withPayload({playerId, correct:true, solution})
        MR-->>CH: ServerMessage.ok("ACCUSATION_RESULT").withCorrelationId(...).withPayload(result)  # private ack
        MR-->>Subs: GameStateUpdate(final)
        Note over MR,GS: finalize game, cleanup
    else incorrect
        AH-->>GE: { correct: false }
        GE-->>MR: result(correct:false, eliminated:playerId, remainingPlayers: [...])
        MR-->>Subs: ServerMessage.ok("ACCUSATION_PUBLIC").withPayload({playerId, correct:false})
        MR-->>CH: ServerMessage.ok("ACCUSATION_RESULT").withCorrelationId(...).withPayload(result)
        MR-->>Subs: GameStateUpdate(updated)
        Note over MR,GE: continue game; advance turn to next active player
    end
```