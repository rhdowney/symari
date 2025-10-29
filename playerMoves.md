```mermaid
sequenceDiagram

box rgb(20,20,40) Client
participant Player
participant Board
participant ClientRouter
end
box rgb(20,40,20) Server 
participant WsBridgeServer as Bridge
participant GameEngine as Engine
participant Location
participant GameState as State
end

Player->>Board: requestMove(location)
alt not adjacent
    Board-->>Player: move denied
end
Board->>ClientRouter: playerRequestsMove(location)
ClientRouter->>Bridge: playerRequestsMove(location)
Bridge->>Engine: playerRequestsMove(location)
Engine->>Location: isFree
alt not free
    Location-->>Engine: not free
    Engine-->>Bridge: not free
    Bridge-->>ClientRouter: not free
    ClientRouter-->>Board: not free
    Board-->>Player: move denied
end
Location-->>Engine: free
Engine-->>State: movePlayer(player,location)
Engine-->>Bridge: move completed 
Bridge-->>ClientRouter: move completed
ClientRouter-->>Board: move completed
Board-->>Player: move completed
