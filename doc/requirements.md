1. Game Setup
	1. The system shall build and maintain a deck of game cards, including nine rooms, six weapons, and
six suspects.
	1. The system shall allow one player to join from a client.
	1. The system shall allow the host to distribute the link to the game, select a character, and start the
game.
	1. The system shall allow additional players to join, each from their own client.
	1. The system shall allow each joining player to choose a character from the available list.
	1. The system shall start the game once the expected number of players have joined.
1. Game Start
	1. The system shall display the game board to all players, showing nine labeled rooms, twelve
passageways, and four secret passageways, following the provided diagram.
	1. The system shall initialize player positions according to the assignment diagram.
	1. The system shall randomly assign weapons to rooms.
	1. The system shall set aside the solution cards: one suspect, one weapon, and one room.
	1. The system shall deal the remaining cards to players.
	1. The system shall notify all players that the game has started.
1. Game Play
	1. The system shall maintain and display the positions of all six characters.
	1. The system shall maintain and display the positions of all six weapons.
	1. The system shall allow each player to view only their own cards.
	1. The system shall pass turns in order, beginning with Scarlet and proceeding clockwise.
	1. The system shall track whether each player is still sleuthing (i.e., has not made a false accusation).
	1. The system shall track whether each player is required to move on their next turn (i.e., was not
moved via Suggestion).
1. Player Turn
	1. If the current player has been eliminated from sleuthing, the system shall pass the turn to the next
player.
	1. The system shall notify all players whose turn it is.
	1. If the player is not required to move, the system shall prompt them to decide whether they wish to
move.
	1. If the player is required or chooses to move, the system shall allow them to do so.
	1. If the player is in a room, the system shall prompt them to make a Suggestion.
	1. The system shall prompt the player to make an Accusation at the end of their turn.
1. Player Movement
	1. The system shall prompt the player to choose a movement direction.
	1. The system shall allow the player to move north, south, east, or west when a valid path exists.
	1. The system shall prevent movement into a passageway already occupied by another player.
	1. The system shall allow use of secret passageways when available in a room.
	1. The system shall update the board with the player’s new position and notify all players.
1. Suggestions
	1. The system shall prompt the Suggester to select a suspect and a weapon.
	1. The system shall automatically assign the Suggester’s current room to the Suggestion.
	1. If the suggested suspect is not in the room, the system shall move them there; if a player controls
that suspect, they shall not be required to move on their next turn.
	1. The system shall move the suggested weapon to the room.
	1. The system shall update the board and notify all players of the Suggestion.
	1. The system shall establish the Disprover rotation, starting with the next player in turn order after
the Suggester, followed by the others.
	1. The system shall prompt each Disprover in turn to attempt to disprove the Suggestion.
	1. If a Disprover holds one or more disproving cards, they must choose one to reveal.
	1. The system shall notify the Suggester which card was shown and notify all other players that the
Suggestion was disproved (without revealing the card).
	1. If a Disprover has no valid card, the system shall pass the Disprover role to the next player in
rotation.
	1. If no one disproves the Suggestion, the Suggester may make an Accusation to end their turn.
1. Accusations
	1. The system shall prompt the Accuser to choose a suspect, weapon, and room.
	1. If the Accusation matches the solution, the system shall declare the Accuser the winner and end
the game.
	1. If the Accusation is false, the system shall remove the Accuser from active gameplay but retain
them for Disproving.
	1. If all players are eliminated from active play after false accusations, the system shall declare no
winner and end the game.

1. Non-functional Requirements
    1. The UI is designed and can be rendered on the latest Chrome, Edge, Safari on desktop browsers.
    1. The UI will provide clear “toast/event feed” for all players.
    1. All game logics are server-authoritative logic, preventing cheating.
    1. No player can read others’ hands or solution.
    1. All “private reveal” events are direct messages to suggester only.
    1. System lag is negligible.
    1. Players get prompt feedback upon taking actions.
    1. The user interface is clear and attractive.
    1. A player who has played traditional Clue finds the game play familiar.
    1. Fault tolerance for client failures – it should not impact the other clients.
    1. Server shall maintain stable operation under load, no more than 	1% packet loss or dropped
connected under moderate load.
