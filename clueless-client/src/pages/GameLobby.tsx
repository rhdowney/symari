import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Check, X, HelpCircle } from '../components/icons';
import mockWebSocket from '../network/ws';
import type { WSMessage, WSMessageType } from '../network/ws';

//== Type Definitions ==//
interface Character {
  id: string;
  name: string;
}

interface CharacterWithStatus extends Character {
  isTaken: boolean;
}

interface LobbyPlayer {
  id: string;
  name: string;
  characterId: string | null;
  characterName: string;
  isReady: boolean;
}

interface GameState {
  id: string;
  hostId: string;
  status: 'waiting' | 'in-game' | 'finished';
  players: LobbyPlayer[];
}

// Use centralized mockWebSocket imported from ../network/ws


//== UI Components ==//

const CharacterCard: React.FC<{ character: CharacterWithStatus; isSelected: boolean; onSelect: (character: Character) => void; }> = ({ character, isSelected, onSelect }) => {
  if (!character) return null;
  const isTaken = character.isTaken;

  // Character-specific circle colors
  const getCharacterColor = (id: string) => {
    switch (id) {
      case 'SCARLET':
        return 'bg-red-600'; // Scarlet color
      case 'WHITE':
        return 'bg-gray-100'; // White color
      case 'PEACOCK':
        return 'bg-blue-600'; // Blue color
      case 'MUSTARD':
        return 'bg-yellow-500'; // Mustard color
      case 'GREEN':
        return 'bg-green-600'; // Green color
      case 'PLUM':
        return 'bg-purple-600'; // Purple/Plum color
      default:
        return 'bg-gray-600';
    }
  };

  const cardClasses = `p-4 rounded-lg flex items-center justify-between transition-all duration-200 ${
    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''
  } ${
    isTaken && !isSelected ? 'bg-gray-700 text-gray-400 opacity-60 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
  }`;

  const circleClasses = `w-12 h-12 rounded-full ${getCharacterColor(character.id)} ${
    isTaken && !isSelected ? 'opacity-50' : ''
  } transition-all duration-200`;

  return (
    <div className={cardClasses} onClick={() => !isTaken && onSelect(character)}>
      <div>
        <p className="text-lg font-bold text-white">{character.name}</p>
        <p className="text-sm text-gray-300">{isTaken && !isSelected ? 'Taken' : 'Select'}</p>
      </div>
      <div className={circleClasses}></div>
    </div>
  );
};

const CharacterGrid: React.FC<{ 
  characters: CharacterWithStatus[] | undefined; 
  selectedCharacter: Character | null; 
  onSelectCharacter: (character: Character) => void;
  temporarySelection: string | null;
}> = ({ characters, selectedCharacter, onSelectCharacter, temporarySelection }) => {
  if (!characters) return <div>Loading characters...</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Select Your Character</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {characters.map((char) => (
          <CharacterCard 
            key={char.id} 
            character={char} 
            isSelected={selectedCharacter?.id === char.id || temporarySelection === char.id} 
            onSelect={onSelectCharacter} 
          />
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-4">
        {temporarySelection ? "Click 'Ready' button to confirm your character selection" : "Select a character to begin"}
      </p>
    </div>
  );
};

const PlayerListItem: React.FC<{ 
  player: LobbyPlayer | null; 
  isCurrentUser: boolean;
  overrideCharacterId?: string | null;
  overrideIsReady?: boolean;
}> = ({ player, isCurrentUser, overrideCharacterId, overrideIsReady }) => {
  if (!player) return (
    <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-center w-10 h-10 bg-gray-700/50 rounded-full mr-4">
        <HelpCircle className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-400">Waiting for player...</p>
    </div>
  );

  // Find the character name from ALL_CHARACTERS if we have a characterId
  const effectiveCharacterId = overrideCharacterId ?? player.characterId;
  const character = effectiveCharacterId ? ALL_CHARACTERS.find(c => c.id === effectiveCharacterId) : null;
  const displayName = isCurrentUser ? 'You' : player.name;
  const displayCharacter = character ? character.name : 'Picking character...';
  const isReadyDisplay = overrideIsReady ?? player.isReady;
  
  return (
    <div className="flex items-center p-3 bg-gray-800 rounded-lg">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 font-bold text-white ${effectiveCharacterId ? 'bg-indigo-600' : 'bg-gray-600'}`}>
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-grow">
        <p className="font-bold text-white">
          {displayName}
        </p>
        <p className="text-sm text-gray-400">{displayCharacter}</p>
      </div>
      {isReadyDisplay ? (
        <span className="flex items-center text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          <Check className="w-3 h-3 mr-1" />Ready
        </span>
      ) : (
        <span className="flex items-center text-xs font-semibold bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full">
          <X className="w-3 h-3 mr-1" />Not Ready
        </span>
      )}
    </div>
  );
};

const PlayerSidebar: React.FC<{ 
  gameState: GameState; 
  currentUser: { id: string }; 
  onReadyToggle: () => void; 
  onLeaveLobby: () => void;
  selectedCharacterId: string | null;
  pendingAction: boolean;
}> = ({ gameState, currentUser, onReadyToggle, onLeaveLobby, selectedCharacterId, pendingAction }) => {
  const { players = [], hostId, status } = gameState;
  const currentUserData = players.find(p => p.id === currentUser?.id);
  const canReady = !!selectedCharacterId;
  const isHost = currentUser.id === hostId;

  // Handle game start and redirection
  useEffect(() => {
    if (status === 'in-game') {
      // Redirect to game board
      window.location.href = '/game';
    }
  }, [status]);

  // Handle ready state and start game controls
  const isEveryoneReady = players.length > 0 && players.every(p => p.isReady);
  const showStartGame = isHost && isEveryoneReady && players.length >= 2;
  
  // Button text based on server state
  const getReadyButtonText = () => {
    if (!canReady) return "Select Character First";
    if (currentUserData?.isReady) return "Cancel Ready";
    return "Ready";
  };
  
  const readyButtonText = getReadyButtonText();

  // Create a fixed array of 6 slots for players
  const playerSlots = Array.from({ length: 6 }).map((_, index) => {
    return players[index] || null;
  });

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Players ({players.length}/6)</h3>
        <span className={`text-sm font-medium px-2 py-1 rounded ${isEveryoneReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {isEveryoneReady ? 'Everyone Ready!' : 'Waiting for players...'}
        </span>
      </div>
      <div className="space-y-3 mb-6 flex-grow">
        {playerSlots.map((player, index) => {
          const isMe = player?.id === currentUser?.id;
          return (
            <PlayerListItem
              key={player?.id || `empty-${index}`}
              player={player}
              isCurrentUser={!!isMe}
              overrideCharacterId={isMe ? selectedCharacterId ?? undefined : undefined}
              overrideIsReady={isMe ? (pendingAction ? true : undefined) : undefined}
            />
          );
        })}
      </div>
      <div className="space-y-2">
        {showStartGame && (
          <button
            onClick={() => {
              mockWebSocket.send({
                type: 'START_GAME',
                gameId: gameState.id,
                playerId: currentUser.id,
                payload: {}
              });
            }}
            className="w-full font-bold py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Start Game
          </button>
        )}
        <button 
          onClick={onReadyToggle} 
          disabled={!canReady || pendingAction} 
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors ${
            !canReady 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : currentUserData?.isReady
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {pendingAction ? 'Waiting...' : readyButtonText}
        </button>
        <button 
          onClick={onLeaveLobby} 
          className="w-full bg-red-800/70 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Leave Lobby
        </button>
        {currentUserData?.id === hostId && isEveryoneReady ? (
          <p className="text-xs text-green-400 text-center pt-2">
            Everyone is ready! You can now start the game.
          </p>
        ) : (
          <p className="text-xs text-gray-400 text-center pt-2">
            {hostId === currentUserData?.id 
              ? "You'll be able to start the game when everyone is ready."
              : "The host will start the game when everyone is ready."}
          </p>
        )}
      </div>
    </div>
  );
};

//== Data Models & Constants ==//
const ALL_CHARACTERS: Character[] = [
  { id: 'SCARLET', name: 'Miss Scarlet' }, { id: 'MUSTARD', name: 'Col. Mustard' }, { id: 'WHITE', name: 'Mrs. White' },
  { id: 'GREEN', name: 'Mr. Green' }, { id: 'PEACOCK', name: 'Mrs. Peacock' }, { id: 'PLUM', name: 'Prof. Plum' },
];

//== Main Page Component ==//
const GameLobby: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const initializedRef = useRef(false);
  const stateRef = useRef<GameState | null>(null);
  
  const roomCode = "CLUE-2024";

  useEffect(() => {
    // StrictMode-safe one-time init
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Stable identity across reloads
    const stored = sessionStorage.getItem('clue_user');
    const mockUser: { id: string; name: string } = stored ? JSON.parse(stored) : { id: `user-${Date.now()}`, name: 'New Player' };
    sessionStorage.setItem('clue_user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);

    // Set up event listeners
    const handleGameState = (data: unknown) => {
      const gameData = data as GameState;
      console.log('[GameState Update]', gameData);
      stateRef.current = gameData;
      setPendingAction(false); // Action is confirmed, re-enable UI
      
      // Host redirect disabled in player lobby to keep UI stable in dev
      // If needed, navigate via router in HostLobby entry point
      
      setGameState(gameData);
      
      // Update selected character and ready state from server
      const playerData = gameData.players.find(p => p.id === mockUser.id);
      if (playerData?.characterId) {
        setSelectedCharacterId(playerData.characterId);
      }
    };

  mockWebSocket.on('GAME_STATE_UPDATE', handleGameState);
    
    // Request initial state and announce player joining
    const joinMsg: WSMessage = { type: 'JOIN_GAME', gameId: roomCode, playerId: mockUser.id, payload: {} };
    mockWebSocket.send(joinMsg);
    mockWebSocket.send({ type: 'REQUEST_INITIAL_STATE', gameId: roomCode, playerId: mockUser.id, payload: {} });

    // Fallback: if no state after 1.5s, request again
    const retryTimer = window.setTimeout(() => {
      if (!stateRef.current) {
        mockWebSocket.send({ type: 'REQUEST_INITIAL_STATE', gameId: roomCode, playerId: mockUser.id, payload: {} });
      }
    }, 1500);

    // Cleanup function to remove event listeners
    return () => {
  window.clearTimeout(retryTimer);
  mockWebSocket.off('GAME_STATE_UPDATE', handleGameState);
    };
  }, []);

  const sendMessage = (type: WSMessageType, payload: Record<string, unknown> = {}) => {
    if (!currentUser) return;
    const msg: WSMessage = { type, gameId: roomCode, playerId: currentUser.id, payload };
    mockWebSocket.send(msg);
  };

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const handleSelectCharacter = (character: Character) => {
    if (!gameState || !currentUser) return;
    const currentUserData = gameState.players.find(p => p.id === currentUser.id);
    // Just update local state, don't send to server yet
    if (!currentUserData?.isReady) {
      setSelectedCharacterId(selectedCharacterId === character.id ? null : character.id);
    }
  };
  
  const handleReadyToggle = () => {
    if (!gameState || !currentUser || pendingAction) return;
    const currentUserData = gameState.players.find(p => p.id === currentUser.id);
    
    setPendingAction(true); // Disable UI until server confirms

    if (currentUserData?.isReady) {
      // If already ready, just toggle ready state
      sendMessage('TOGGLE_READY', {});
    } else if (selectedCharacterId) {
      // If not ready and has selected character, send both character selection and ready
      sendMessage('SELECT_CHARACTER', { characterId: selectedCharacterId });
      sendMessage('TOGGLE_READY', {});
    } else {
      setPendingAction(false); // No action was taken
    }
  };

  const handleLeaveLobby = () => {
    if (!currentUser || !gameState) return;

    if (window.confirm('Are you sure you want to leave the lobby?')) {
      // First send leave message to server
      sendMessage('LEAVE_GAME', { gameId: roomCode });
      
      // Clean up the current user and game state
      setCurrentUser(null);
      setGameState(null);
      
      // Clear session storage
      sessionStorage.removeItem('clue_user');

      // Remove all WebSocket listeners (will be cleaned up by useEffect cleanup)
      // mockWebSocket listeners are cleaned up automatically on component unmount
      
      // Navigate to a different page or show a "game ended" state
      const rootElement = document.getElementById('root');
      if (rootElement) {
        ReactDOM.createRoot(rootElement).render(
          <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white flex-col gap-4">
            <h1 className="text-2xl font-bold">You have left the game</h1>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Join New Game
            </button>
          </div>
        );
      }
    }
  };

  const charactersWithStatus = useMemo((): CharacterWithStatus[] | undefined => {
    if (!gameState) return undefined;
    const takenCharacterIds = new Set(gameState.players.map(p => p.characterId));
    return ALL_CHARACTERS.map(char => ({ ...char, isTaken: takenCharacterIds.has(char.id) }));
  }, [gameState]);

  const selectedCharacter = useMemo(() => {
    if (!gameState || !currentUser) return null;
    const charId = gameState.players.find(p => p.id === currentUser.id)?.characterId;
    return ALL_CHARACTERS.find(c => c.id === charId) || null;
  }, [gameState, currentUser]);
  
  if (!gameState || !currentUser) {
      return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white"><p>Joining Lobby...</p></div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Game Lobby</h1>
        </header>
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <CharacterGrid 
              characters={charactersWithStatus} 
              selectedCharacter={selectedCharacter} 
              onSelectCharacter={handleSelectCharacter}
              temporarySelection={selectedCharacterId}
            />
          </div>
          <div className="md:col-span-1">
            <PlayerSidebar 
              gameState={gameState} 
              currentUser={currentUser} 
              onReadyToggle={handleReadyToggle} 
              onLeaveLobby={handleLeaveLobby}
              selectedCharacterId={selectedCharacterId}
              pendingAction={pendingAction}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default GameLobby;

