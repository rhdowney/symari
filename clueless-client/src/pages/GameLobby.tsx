import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context';
import type { WSMessage, WSMessageType } from '../network/ws';

//== Import your reusable components ==//
import CharacterGrid from '../components/lobby/CharacterGrid';
import PlayerListItem from '../components/lobby/PlayerListItem';
import type {
  Character,
  CharacterWithStatus,
  GameState,
  LobbyPlayer,
} from '../components/lobby/LobbyTypes';
import { ALL_CHARACTERS } from '../components/lobby/LobbyTypes';

//== Main Page Component ==//
const GameLobby: React.FC = () => {
  // Navigation and WebSocket setup
  const navigate = useNavigate();
  const ws = useWebSocket();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const initializedRef = useRef(false);
  
  // You should get this from the URL parameters in a real app
  const roomCode = "CLUE-2024";

  // Input validation function for security
  const validateCharacter = useCallback((character: Character): boolean => {
    return character && 
           typeof character.id === 'string' && 
           character.id.length > 0 &&
           ALL_CHARACTERS.some(c => c.id === character.id);
  }, []);

  // Event handlers with proper error handling
  const handleGameState = useCallback((payload: unknown) => {
    try {
      const gameData = payload as GameState;
      console.log('[Lobby GameState Update]', gameData);
      setGameState(gameData);
      setPendingAction(false); // Action is confirmed, re-enable UI
      setError(null); // Clear any previous errors
      setIsConnecting(false);

      // Handle navigation when game starts
      if (gameData.status === 'in-game') {
        console.log('Game started! Navigating to game board');
        navigate('/gameboard');
      }

      // Update selected character from server state
      if (currentUser) {
        const playerData = gameData.players.find((p: LobbyPlayer) => p.id === currentUser.id);
        if (playerData?.characterId) {
          setSelectedCharacterId(playerData.characterId);
        }
      }
    } catch (err) {
      console.error('[Lobby] Error processing game state:', err);
      setError('Failed to process game update. Please refresh and try again.');
      setIsConnecting(false);
    }
  }, [currentUser, navigate]);

  const handleError = useCallback((error: unknown) => {
    console.error('[Lobby] WebSocket error:', error);
    setError('Connection error. Please refresh and try again.');
    setIsConnecting(false);
    setPendingAction(false);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Stable identity across reloads
    const stored = sessionStorage.getItem('clue_user');
    const mockUser: { id: string; name: string } = stored ? JSON.parse(stored) : { id: `user-${Date.now()}`, name: 'New Player' };
    sessionStorage.setItem('clue_user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);

    ws.on('GAME_STATE_UPDATE', handleGameState);
    ws.on('ERROR', handleError);
    
    // Request initial state and announce player joining
    const joinMsg: WSMessage = { type: 'JOIN_GAME', gameId: roomCode, playerId: mockUser.id, payload: {} };
    ws.send(joinMsg);
    ws.send({ type: 'REQUEST_INITIAL_STATE', gameId: roomCode, playerId: mockUser.id, payload: {} });

    // Cleanup function to remove event listeners
    return () => {
      ws.off('GAME_STATE_UPDATE', handleGameState);
      ws.off('ERROR', handleError);
    };
  }, [ws, roomCode, handleGameState, handleError]); // Add dependencies

  // Send message helper with useCallback for performance
  const sendMessage = useCallback((type: WSMessageType, payload: Record<string, unknown> = {}) => {
    if (!currentUser) return;
    const msg: WSMessage = { type, gameId: roomCode, playerId: currentUser.id, payload };
    ws.send(msg);
  }, [currentUser, roomCode, ws]);

  const handleSelectCharacter = useCallback((character: Character) => {
    // Input validation for security
    if (!validateCharacter(character)) {
      console.error('Invalid character selection:', character);
      return;
    }
    
    if (!gameState || !currentUser) return;
    
    // Check if character is already confirmed by another player
    const isCharacterTaken = gameState.players.some((p: LobbyPlayer) => 
      p.isReady && p.characterId === character.id && p.id !== currentUser.id
    );
    
    if (isCharacterTaken) {
      console.log('Character already taken by another player');
      return;
    }
    
    // Allow selection/deselection of characters
    setSelectedCharacterId(prev => prev === character.id ? null : character.id);
  }, [validateCharacter, gameState, currentUser]);
  
  const handleConfirmCharacter = useCallback(() => {
    if (!gameState || !currentUser || pendingAction || !selectedCharacterId) return;
    const currentUserData = gameState.players.find((p: LobbyPlayer) => p.id === currentUser.id);
    
    setPendingAction(true); // Disable UI until server confirms

    if (currentUserData?.isReady && currentUserData?.characterId) {
      // If already confirmed, allow changing character (unready first, then select new)
      sendMessage('TOGGLE_READY', {});
      // The character selection will be handled when they click confirm again
    } else {
      // Confirm the selected character
      sendMessage('SELECT_CHARACTER', { characterId: selectedCharacterId });
      sendMessage('TOGGLE_READY', {});
    }
  }, [gameState, currentUser, pendingAction, selectedCharacterId, sendMessage]);

  const handleLeaveLobby = useCallback(() => {
    if (!currentUser) return;

    if (window.confirm('Are you sure you want to leave the lobby?')) {
      sendMessage('LEAVE_GAME', {});
      sessionStorage.removeItem('clue_user');
      navigate('/');
    }
  }, [currentUser, sendMessage, navigate]);

  const charactersWithStatus = useMemo((): CharacterWithStatus[] | undefined => {
    if (!gameState) return undefined;
    // Only mark characters as taken if they are confirmed (player is ready with that character)
    const confirmedCharacterIds = new Set(
      gameState.players
        .filter((p: LobbyPlayer) => p.isReady && p.characterId) // Only confirmed characters
        .map((p: LobbyPlayer) => p.characterId)
    );
    return ALL_CHARACTERS.map(char => ({ 
      ...char, 
      isTaken: confirmedCharacterIds.has(char.id) 
    }));
  }, [gameState]);


  
  // Error state handling
  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state handling
  if (!gameState || !currentUser || isConnecting) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">
            {isConnecting ? 'Connecting to lobby...' : 'Joining Lobby...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">🎲 Game Lobby</h1>
          <p className="text-gray-400">Waiting for players to join...</p>
        </header>
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <CharacterGrid 
              characters={charactersWithStatus} 
              selectedCharacter={selectedCharacterId ? { id: selectedCharacterId, name: '' } : null} // Pass local selection
              onSelectCharacter={handleSelectCharacter}
            />
          </div>
          <div className="md:col-span-1">
            {/* Custom PlayerSidebar for participants only */}
            <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col h-full">
              <h3 className="text-lg font-bold text-white mb-4">Players ({gameState.players.length}/6)</h3>
              <div className="space-y-3 mb-6 flex-grow">
                {Array.from({ length: 6 }).map((_, index) => {
                  const player = gameState.players[index];
                  return (
                    <PlayerListItem 
                      key={player?.id || `empty-${index}`} 
                      player={player} 
                      isCurrentUser={player?.id === currentUser?.id} 
                      isHost={false} // No host functionality for participants
                      overrideCharacterId={player?.id === currentUser?.id ? selectedCharacterId : undefined}
                    />
                  );
                })}
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleConfirmCharacter}
                  disabled={!selectedCharacterId || pendingAction}
                  className={`w-full font-bold py-3 px-4 rounded-lg transition-colors ${
                    !selectedCharacterId || pendingAction
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : gameState.players.find(p => p.id === currentUser?.id)?.isReady
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {pendingAction 
                    ? 'Processing...'
                    : !selectedCharacterId 
                    ? 'Select Character First' 
                    : gameState.players.find(p => p.id === currentUser?.id)?.isReady 
                    ? 'Change Character' 
                    : 'Confirm Character'}
                </button>
                <button 
                  onClick={handleLeaveLobby}
                  className="w-full bg-red-800/70 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Leave Lobby
                </button>
                <p className="text-xs text-gray-400 text-center pt-2">
                  Select and confirm your character to join the game.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default GameLobby;