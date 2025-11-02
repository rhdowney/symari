sequenceDiagram
    autonumber
    participant C as Suggester(Client)
    participant CH as ClientHandler
    participant MR as MessageRouter
    participant MV as MessageValidator
    participant GE as GameEngine
    participant SH as SuggestionHandler
    participant Pn as PlayerN (next)
    participant Pk as PlayerK (others)
    participant S as Suggester (server-private)

    Note over C,CH: Suggester sends SUGGESTION JSON line

    C->>CH: ClientMessage(SUGGESTION)
    CH->>MR: route(clientId,msg,out)
    MR->>MV: validate(msg)
    MV-->>MR: ok

    MR->>GE: handleSuggestion(gameId, playerId, payload)
    GE->>SH: resolveSuggestion(suggester, payload)
    SH->>Pn: checkHandForMatches()
    alt has matches
        Pn-->>SH: matches (list)
        SH->>Pn: (choose one card to reveal, possibly ask client)
        Pn-->>SH: revealCard (or server chooses)
        SH-->>GE: {disprover: Pn, revealedCard}
    else no matches
        Pn-->>SH: no matches
        SH->>Pk: check next player...
    end
    alt no disprover found
        SH-->>GE: {disprover: null}
    end

    GE-->>MR: result
    MR-->>CH: ServerMessage.ok("SUGGESTION_RESULT") -> private to suggester
    MR-->>(optional) Pn: ServerMessage.ok("SUGGESTION_DISPROVED_ACK")
    MR-->>(optional) all: ServerMessage.ok("SUGGESTION_COMPLETE")  (public summary)
    CH-->>C: Suggester receives suggestion result (private)