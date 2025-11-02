# Player Accusation Flow (Server)

Summary
- A formal, public claim that a player believes they know the solution (suspect, weapon, room).
- If correct → game ends, reveal solution, declare winner.
- If incorrect → accusing player is eliminated (policy configurable), game continues without them.

Inputs (Client -> Server)
- ClientMessage:
  - type: "ACCUSATION"
  - correlationId: string (required)
  - gameId: string (required)
  - playerId: string (required)
  - payload: { suspect: string, weapon: string, room: string }

Primary components
- ClientHandler: parses incoming JSON and writes back ServerMessage responses.
- MessageValidator: enforces required fields and payload keys.
- MessageRouter: dispatches ACCUSATION to GameEngine and coordinates replies/broadcasts.
- GameEngine / AccusationHandler: checks accusation against solution and mutates GameState.
- GameState: stores solution, player status, turn order, gameOver/winner.
- ConnectionRegistry (optional): used to broadcast public updates to all players.
- ServerMessage / GameStateUpdate / ErrorMessage: outbound DTOs.

Step-by-step flow
1) Receive & parse
- ClientHandler reads a JSON line and parses into ClientMessage.
- Forwards to MessageRouter.route(clientId, msg, out).

2) Validate
- MessageValidator ensures type==ACCUSATION, correlationId, gameId, playerId present, and payload contains suspect/weapon/room.

3) Route to engine
- MessageRouter calls GameEngine.handleAccusation(gameId, playerId, suspect, weapon, room).

4) Engine checks solution
- If accusation matches GameState.solution:
  - Set GameState.gameOver = true
  - Set GameState.winner = playerId
  - Optionally reveal full solution details in GameState or ServerMessage payload
  - Prepare result: { correct: true, winner: playerId, solution: {...} }
- If accusation does not match:
  - Mark player as eliminated (policy: cannot make further moves/accusations; may still be required to show cards to others)
  - Remove player from turn order (or flag them inactive)
  - Check end conditions (only one active player remains → that player wins)
  - Prepare result: { correct: false, eliminated: playerId, remainingPlayers: [...] }

5) Respond & broadcast
- To accuser (private): ServerMessage.ok("ACCUSATION_RESULT")
  - withCorrelationId(...)
  - withPayload(result) — include revealed solution only if correct
- To all players (public): ServerMessage.ok("ACCUSATION_PUBLIC")
  - withPayload({ playerId, correct: true|false, (solution if correct) })
- If correct:
  - Broadcast GameStateUpdate with final state and winner
  - Trigger end-of-game cleanup (persist logs, close sessions)
- If incorrect:
  - Broadcast GameStateUpdate reflecting elimination and updated turn order

Side effects
- Mutates GameState.solution (read), GameState.gameOver, GameState.winner.
- Mutates player status (eliminated/inactive) and turn order.
- May trigger game termination and resource cleanup.

Failure modes and errors
- INVALID: missing fields or malformed payload (validator triggers error response).
- NOT_FOUND: gameId or playerId not known.
- UNAUTHORIZED: player attempts accusation out of turn (policy; enforce in validator/router).
- UNEXPECTED: internal errors; return ServerMessage.error("UNEXPECTED", ...).

Policy & privacy notes
- Accusations are public: other players learn the accusation and whether it was correct.
- Revealing the actual solution should occur only when the accusation is correct.
- Incorrect accuser is typically eliminated from winning but may still be asked to reveal cards; confirm policy and document in README.

Pseudocode (core)
```
result = engine.handleAccusation(gameId, playerId, suspect, weapon, room)
if result.correct:
  broadcast(ServerMessage.ok("ACCUSATION_PUBLIC").withPayload({playerId, correct:true, solution:result.solution}))
  sendTo(playerId, ServerMessage.ok("ACCUSATION_RESULT").withCorrelationId(cid).withPayload(result))
  broadcast(GameStateUpdate(engine.getStateSummary(gameId)))
  // finalize game
else:
  markPlayerEliminated(gameId, playerId)
  broadcast(ServerMessage.ok("ACCUSATION_PUBLIC").withPayload({playerId, correct:false}))
  sendTo(playerId, ServerMessage.ok("ACCUSATION_RESULT").withCorrelationId(cid).withPayload(result))
  broadcast(GameStateUpdate(engine.getStateSummary(gameId)))
  // continue with next active player
```

