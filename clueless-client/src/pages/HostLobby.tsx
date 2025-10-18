import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context';
import type { WSMessage, WSMessageType } from '../network/ws';
import CharacterGrid from '../components/lobby/CharacterGrid';
import InvitePanel from '../components/lobby/InvitePanel';
import HostSidebar from '../components/lobby/HostSidebar';
import {
  ALL_CHARACTERS,
  type Character,
  type CharacterWithStatus,
  type GameState,
} from '../components/lobby/LobbyTypes';

//== Main Page Component ==//
const HostLobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const ws = useWebSocket();
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

    // Stable identity across reloads for host
    const stored = sessionStorage.getItem('clue_host');
    const mockUser: { id: string; name: string } = stored ? JSON.parse(stored) : { id: `host-${Date.now()}`, name: 'Host' };
    sessionStorage.setItem('clue_host', JSON.stringify(mockUser));
    setCurrentUser(mockUser);

    // Set up event listeners
    const handleGameState = (data: unknown) => {
      const gameData = data as GameState;
      console.log('[HostLobby GameState Update]', gameData);
      stateRef.current = gameData;
      setPendingAction(false); // Action is confirmed, re-enable UI
      
      // Handle navigation when game starts
      if (gameData.status === 'in-game') {
        console.log('Game started! Host navigating to game board');
        navigate('/gameboard');
      }
      
      setGameState(gameData);
    };

    ws.on('GAME_STATE_UPDATE', handleGameState);
    
    // Request initial state and announce host joining
    const joinMsg: WSMessage = { type: 'JOIN_GAME', gameId: roomCode, playerId: mockUser.id, payload: {} };
    ws.send(joinMsg);
    ws.send({ type: 'REQUEST_INITIAL_STATE', gameId: roomCode, playerId: mockUser.id, payload: {} });

    // Fallback: if no state after 1.5s, request again
    const retryTimer = window.setTimeout(() => {
      if (!stateRef.current) {
        ws.send({ type: 'REQUEST_INITIAL_STATE', gameId: roomCode, playerId: mockUser.id, payload: {} });
      }
    }, 1500);

    // Cleanup function to remove event listeners
    return () => {
      window.clearTimeout(retryTimer);
      ws.off('GAME_STATE_UPDATE', handleGameState);
    };
  }, [navigate, ws]);

  const sendMessage = (type: WSMessageType, payload: Record<string, unknown> = {}) => {
    if (!currentUser) return;
    const msg: WSMessage = { type, gameId: roomCode, playerId: currentUser.id, payload };
    ws.send(msg);
  };

  const handleSelectCharacter = (character: Character) => {
    if (!gameState || !currentUser || pendingAction) return;
    const currentUserData = gameState.players.find(p => p.id === currentUser.id);
    
    // Don't allow character change if already ready
    if (currentUserData?.isReady) return;
    
    setPendingAction(true);
    const newCharacterId = currentUserData?.characterId === character.id ? null : character.id;
    sendMessage('SELECT_CHARACTER', { characterId: newCharacterId });
  };

  const handleReadyToggle = () => {
    if (!gameState || !currentUser || pendingAction) return;
    const currentUserData = gameState.players.find(p => p.id === currentUser.id);
    
    setPendingAction(true); // Disable UI until server confirms

    if (currentUserData?.isReady) {
      // If already ready, just toggle ready state
      sendMessage('TOGGLE_READY', {});
    } else if (currentUserData?.characterId) {
      // If not ready and has selected character, send both character selection and ready
      sendMessage('SELECT_CHARACTER', { characterId: currentUserData.characterId });
      sendMessage('TOGGLE_READY', {});
    } else {
      setPendingAction(false); // No action was taken
    }
  };
  
  const handleLeaveLobby = () => {
    if (!currentUser) return;
    
    if (window.confirm('Are you sure you want to leave the lobby?')) {
      sendMessage('LEAVE_GAME', {});
      
      // Clear session storage
      sessionStorage.removeItem('clue_host');
      
      // Navigate away or refresh
      window.location.reload();
    }
  };

  const handleStartGame = () => {
    if (!currentUser || !gameState || pendingAction) return;
    if (currentUser.id !== gameState.hostId) return;
    
    setPendingAction(true);
    sendMessage('START_GAME', {});
  };

  const charactersWithStatus = useMemo((): CharacterWithStatus[] | undefined => {
    if (!gameState) return undefined;
    const takenCharacterIds = new Set(gameState.players.map((p) => p.characterId));
    return ALL_CHARACTERS.map((char) => ({ ...char, isTaken: takenCharacterIds.has(char.id) }));
  }, [gameState]);

  const selectedCharacter = useMemo(() => {
    if (!gameState || !currentUser) return null;
    const charId = gameState.players.find((p) => p.id === currentUser.id)?.characterId;
    return ALL_CHARACTERS.find((c) => c.id === charId) || null;
  }, [gameState, currentUser]);

  if (!gameState || !currentUser) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <p>Creating Lobby...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Game Lobby — Host View</h1>
          <p className="text-gray-400">You are the host of this game</p>
        </header>
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <InvitePanel roomCode={roomCode} />
            <CharacterGrid
              characters={charactersWithStatus}
              selectedCharacter={selectedCharacter}
              onSelectCharacter={handleSelectCharacter}
            />
          </div>
          <div className="md:col-span-1">
            <HostSidebar
              gameState={gameState}
              currentUser={currentUser}
              onReadyToggle={handleReadyToggle}
              onLeaveLobby={handleLeaveLobby}
              onStartGame={handleStartGame}
              pendingAction={pendingAction}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default HostLobbyPage;

