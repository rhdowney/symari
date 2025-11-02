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
    participant Subs as Subscribers

    Note over C,CH: Client sends ACCUSATION JSON line

    C->>CH: ClientMessage(ACCUSATION)
    CH->>MR: route(clientId, msg, out)
    MR->>MV: validate(msg)
    alt invalid
        MV-->>MR: throw IllegalArgumentException
        MR-->>CH: send ServerMessage.error(INVALID)
        CH-->>C: send error JSON
    else valid
        MV-->>MR: ok
    end

    MR->>GE: handleAccusation(gameId, playerId, suspect, weapon, room)
    GE->>AH: resolveAccusation(playerId, suspect, weapon, room)
    AH->>GS: compare accusation with solution
    alt correct
        AH-->>GE: result { correct: true, solution }
        GE-->>MR: result(correct:true, winner:playerId, solution)
        MR-->>Subs: send ACCUSATION_PUBLIC with solution and winner
        MR-->>CH: send ACCUSATION_RESULT to accuser (private)
        MR-->>Subs: send GameStateUpdate (final)
        Note over MR,GS: finalize game and cleanup
    else incorrect
        AH-->>GE: result { correct: false }
        GE-->>MR: result(correct:false, eliminated:playerId, remainingPlayers)
        MR-->>Subs: send ACCUSATION_PUBLIC that player was incorrect
        MR-->>CH: send ACCUSATION_RESULT to accuser (private)
        MR-->>Subs: send GameStateUpdate (updated)
        Note over MR,GE: continue game and advance turn to next active player
    end