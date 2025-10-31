# Clue-Less Architecture

Symari's Clue-Less consists of a central server and a client for each player.  Client-server communication is handled by a WebSocket.  Messages between the client and server are json-formatted.  The first client to connect to the server becomes the host, who then controls access for subsequent clients.  The host also decides when the game starts.

Each client provides a graphical user interface that displays game information, including the game board, to the player.  The user interface also collects input from the player and passes that input to the server for processing.  When a message is received from the server, the client updates the user interface accordingly and requests input as needed.

The server enrolls clients, maintains the game state, handles game logic, and routes messages to and from the clients as needed.   Messages received by the server are validated for format and sender identity, then parsed, interpreted, and sent to the game engine for processing.  The game engine updates the game state based on the message, then produces the next message to be sent to the appropriate client or to all clients as needed.

