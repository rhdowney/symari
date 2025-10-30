```mermaid
flowchart TD

Client-->|Join Game Request|ClientHandler
ClientHandler-->|Parsed message|MessageRouter
MessageRouter-->|Add player to game|GameEngine
GameEngine-->|Add player|GameState
GameEngine-->|Player added|MessageRouter
MessageRouter-->|Player added|ClientHandler
ClientHandler-->|Join Game Approved|Client
```
