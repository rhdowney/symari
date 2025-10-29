```mermaid
sequenceDiagram

box transparent Aqua Client
participant Player
participant Board
end
box Server
participant Location
end

Player->>Board: requestMove(location)
alt not adjacent
    Board-->>Player: move denied
end
Board->>Location: isFree
alt not free
    Location-->>Board: not free
    Board-->>Player: move denied
end
Location-->>Board: free
Board-->>Player: move completed
