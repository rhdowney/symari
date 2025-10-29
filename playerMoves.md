```mermaid
sequenceDiagram

box rgb(20,20,40) Client
participant Player
participant Board
participant ClientRouter
end
box rgb(20,40,20) Server 
participant WsBridgeServer
participant Location
participant MessageRouter
end

Player->>Board: requestMove(location)
alt not adjacent
    Board-->>Player: move denied
end
Board->>WsBridgeServer: playerRequestsMove(location)
WsBridgeServer->>Location: isFree
alt not free
    Location-->>WsBridgeServer: not free
    WsBridgeServer-->>ClientRouter: not free
    ClientRouter-->>Board: not free
    Board-->>Player: move denied
end
Location-->>WsBridgeServer: free
WsBridgeServer-->>ClientRouter: free
ClientRouter-->>Board: free
Board-->>Player: move completed
