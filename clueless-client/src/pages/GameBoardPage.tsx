import React, { useState, useEffect } from 'react';

//== Type Definitions ==//
interface Card {
  id: string;
  name: string;
  type: 'SUSPECT' | 'WEAPON' | 'ROOM';
}

interface PlayerToken {
  playerId: string;
  characterId: string;
  locationId: string; // e.g., "STUDY", "HALL_STUDY_LIBRARY"
}

interface GamePlayer extends LobbyPlayer {
    hand: Card[];
}

interface GameState {
  hostId: string;
  status: 'in-game' | 'finished';
  players: GamePlayer[];
  playerTokens: PlayerToken[];
  currentTurnPlayerId: string;
  suggestion: { suggesterId: string; suggestion: string; disproverId: string | null; disproved: boolean; } | null;
  winner: string | null;
  eventFeed: string[];
}

// Re-defining lobby types here for a self-contained file
interface LobbyPlayer { id: string; name: string; characterId: string | null; characterName: string; isReady: boolean; }


import mockWebSocket from '../network/ws';
import type { WSMessage, WSMessageType } from '../network/ws';


//== UI Components ==//

const ToastNotification: React.FC<{ gameState: GameState, currentUser: {id: string} }> = ({ gameState, currentUser }) => {
    const isMyTurn = gameState.currentTurnPlayerId === currentUser.id;
    const currentPlayerName = gameState.players.find(p => p.id === gameState.currentTurnPlayerId)?.characterName || 'a player';

    const statusText = isMyTurn ? "Your Turn" : `Waiting for ${currentPlayerName}...`;
    const subText = isMyTurn ? "Select an action: Move, Suggest, or Accuse." : "";

    return (
        <div className={`w-full p-2 text-center text-white rounded-t-lg ${isMyTurn ? 'bg-blue-600' : 'bg-gray-700'}`}>
            <p className="font-bold">{statusText}</p>
            {subText && <p className="text-sm opacity-80">{subText}</p>}
        </div>
    );
};

const PlayerToken: React.FC<{characterId: string}> = ({ characterId }) => {
    const colorMap: Record<string, string> = {
        SCARLET: 'bg-red-500', MUSTARD: 'bg-yellow-500', WHITE: 'bg-white text-black',
        GREEN: 'bg-green-500', PEACOCK: 'bg-blue-400', PLUM: 'bg-purple-500'
    };
    return <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${colorMap[characterId]}`}>{characterId.charAt(0)}</div>
}

const BoardGrid: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    // This is a simplified representation. A real implementation would have more complex logic for positioning.
    const locations = [
        "Study", "Hallway", "Hall", "Hallway", "Lounge",
        "Hallway", null, "Hallway", null, "Hallway",
        "Library", "Hallway", "Billiard Room", "Hallway", "Dining Room",
        "Hallway", null, "Hallway", null, "Hallway",
        "Conservatory", "Hallway", "Ballroom", "Hallway", "Kitchen"
    ];

    const findTokensAt = (location: string | null) => {
        if (!location) return [];
        return gameState.playerTokens.filter(t => t.locationId.toLowerCase().replace(/\s/g, '') === location.toLowerCase().replace(/\s/g, ''));
    };

    return (
        <div className="bg-gray-800 p-4 rounded-b-lg aspect-[4/3] flex-grow">
            <div className="w-full h-full bg-gray-900 grid grid-cols-5 grid-rows-5 gap-2 p-2">
                {locations.map((loc, index) => {
                    if (!loc) return <div key={index} className="bg-gray-900"></div>; // Empty space
                    const tokens = findTokensAt(loc);
                    return (
                        <div key={index} className={`rounded-md flex items-center justify-center p-2 text-center ${loc === 'Hallway' ? 'bg-gray-600' : 'bg-gray-700'}`}>
                           <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-white">{loc !== 'Hallway' ? loc : ''}</span>
                               <div className="flex gap-1 mt-1">{tokens.map(t => <PlayerToken key={t.playerId} characterId={t.characterId}/>)}</div>
                           </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ActionBar: React.FC<{ isMyTurn: boolean, onMove: () => void, onSuggest: () => void, onAccuse: () => void }> = ({ isMyTurn, onMove, onSuggest, onAccuse }) => {
    const baseClass = "font-bold py-2 px-6 rounded-lg transition-colors";
    const enabledClass = "bg-gray-600 hover:bg-gray-500 text-white";
    const disabledClass = "bg-gray-800 text-gray-500 cursor-not-allowed";

    return (
        <div className="flex justify-center items-center gap-4 py-3 bg-gray-900">
            <button onClick={onMove} disabled={!isMyTurn} className={`${baseClass} ${isMyTurn ? enabledClass : disabledClass}`}>Move</button>
            <button onClick={onSuggest} disabled={!isMyTurn} className={`${baseClass} ${isMyTurn ? enabledClass : disabledClass}`}>Suggest</button>
            <button onClick={onAccuse} disabled={!isMyTurn} className={`${baseClass} ${isMyTurn ? enabledClass : disabledClass}`}>Accuse</button>
        </div>
    );
};

const HandPanel: React.FC<{ cards: Card[] }> = ({ cards }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex-1">
        <h3 className="font-bold text-white mb-2">Your Hand (Private)</h3>
        <div className="flex flex-wrap gap-2">
            {cards.map(card => (
                <div key={card.id} className="bg-gray-700 p-2 rounded-md text-white text-sm">
                    {card.name}
                </div>
            ))}
        </div>
    </div>
);

const EventFeed: React.FC<{ events: string[] }> = ({ events }) => (
     <div className="bg-gray-800 p-4 rounded-lg flex-1">
        <h3 className="font-bold text-white mb-2">Event Feed (Public)</h3>
        <ul className="text-sm text-gray-300 space-y-1">
            {events.map((event, index) => <li key={index}>{event}</li>)}
        </ul>
    </div>
);


//== Main Page Component ==//
const GameBoardPage: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  
  const roomCode = "CLUE-2024";

  useEffect(() => {
    const mockUser = { id: `user-${Date.now()}`, name: 'New Player' };
    setCurrentUser(mockUser);
        mockWebSocket.on('GAME_STATE_UPDATE', (data: unknown) => setGameState(data as GameState));
        const req: WSMessage = { type: 'REQUEST_INITIAL_STATE', gameId: roomCode, playerId: mockUser.id, payload: {} };
        mockWebSocket.send(req);
  }, []);

    const sendMessage = (type: WSMessageType, payload: Record<string, unknown> = {}) => {
        if (!currentUser) return;
        const msg: WSMessage = { type, gameId: roomCode, playerId: currentUser.id, payload };
        mockWebSocket.send(msg);
    };

  const handleMove = () => {
    // In a real app, this would open a modal to select where to move.
    sendMessage('MOVE_REQUEST', { targetLocationId: 'Library' });
  };

  const handleSuggest = () => {
    // In a real app, this would open a modal to select suspect & weapon.
    sendMessage('MAKE_SUGGESTION', { suspectId: 'MUSTARD', weaponId: 'WRENCH', roomId: 'Library' });
  };
  
  const handleAccuse = () => {
    // In a real app, this would open a confirmation modal.
    sendMessage('MAKE_ACCUSE', { suspectId: 'WHITE', weaponId: 'ROPE', roomId: 'Hall' });
  };
  
  if (!gameState || !currentUser) {
      return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white"><p>Loading Game...</p></div>;
  }
  
  const isMyTurn = gameState.currentTurnPlayerId === currentUser.id;
  const myCards = gameState.players.find(p => p.id === currentUser.id)?.hand || [];

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8 flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex flex-col flex-grow">
          <ToastNotification gameState={gameState} currentUser={currentUser} />
          <BoardGrid gameState={gameState} />
          <ActionBar isMyTurn={isMyTurn} onMove={handleMove} onSuggest={handleSuggest} onAccuse={handleAccuse}/>
          <div className="flex gap-4 mt-4">
              <HandPanel cards={myCards} />
              <EventFeed events={gameState.eventFeed} />
          </div>
      </div>
    </div>
  );
}

export default GameBoardPage;
