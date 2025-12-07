import { useState, useEffect } from 'react';
import { useWebSocket } from '../context/useWebSocket';
import type { GameSnapshot, LobbySnapshot } from '../api/types';

export function usePlayer() {
  const { connected, send, lastMessage } = useWebSocket();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string>('default');
  const [gameState, setGameState] = useState<GameSnapshot | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbySnapshot | null>(null);
  const [isInLobby, setIsInLobby] = useState(false);
  const [isInGame, setIsInGame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameEvents, setGameEvents] = useState<string[]>([]);
  const [disprovePrompt, setDisprovePrompt] = useState<{
    suggester: string;
    suspect: string;
    weapon: string;
    room: string;
    matchingCards: string[];
  } | null>(null);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('[usePlayer] Processing message:', lastMessage);

    if (lastMessage.type === 'ERROR') {
      setError(lastMessage.message);
      return;
    }

    if (lastMessage.type === 'ACK') {
      if (lastMessage.for === 'JOIN_LOBBY') {
        setIsInLobby(true);
        if (lastMessage.lobby) {
          setLobbyState(lastMessage.lobby);
        }
        if (lastMessage.playerId) {
          setPlayerId(lastMessage.playerId);
        }
        if (lastMessage.gameId) {
          setGameId(lastMessage.gameId);
        }
      } else if (lastMessage.for === 'START_GAME') {
        setIsInLobby(false);
        setIsInGame(true);
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      }
    }

    if (lastMessage.type === 'EVENT') {
      if (lastMessage.event === 'LOBBY_JOIN' || 
          lastMessage.event === 'CHARACTER_SELECTED' || 
          lastMessage.event === 'CHARACTER_UNSELECTED' ||
          lastMessage.event === 'READY_CHANGED') {
        if (lastMessage.lobby) {
          setLobbyState(lastMessage.lobby);
        }
      } else if (lastMessage.event === 'START_GAME') {
        setIsInLobby(false);
        setIsInGame(true);
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      } else if (lastMessage.event === 'SUGGEST') {
        // Public suggestion event - add to event feed
        const suggester = lastMessage.playerId || 'Someone';
        const suspect = lastMessage.suspect || '?';
        const weapon = lastMessage.weapon || '?';
        const room = lastMessage.room || '?';
        const disprover = lastMessage.disprover || null;
        
        const eventText = disprover
          ? `${suggester} suggested ${suspect} with ${weapon} in ${room}. ${disprover} disproved it.`
          : `${suggester} suggested ${suspect} with ${weapon} in ${room}. No one could disprove!`;
        
        setGameEvents(prev => [...prev, eventText]);
        
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      } else if (lastMessage.event === 'DISPROVE_REVEAL') {
        // Private reveal of disprove card to suggester
        // Card will be shown in SuggestionResultModal, not in event feed
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      } else if (lastMessage.event === 'DISPROVE_DONE') {
        // Broadcast that disprove process completed (no card shown publicly)
        const disprover = lastMessage.disprover || 'Someone';
        const suggester = lastMessage.suggester || 'Someone';
        if (playerId !== suggester && playerId !== disprover) {
          setGameEvents(prev => [...prev, `${disprover} disproved ${suggester}'s suggestion`]);
        }
      } else if (lastMessage.event === 'ACCUSE') {
        // Accusation event - add to event feed
        const accuser = lastMessage.by || 'Someone';
        const result = lastMessage.result || 'UNKNOWN';
        
        const eventText = result === 'WIN'
          ? `🎉 ${accuser} made the correct accusation and won!`
          : `❌ ${accuser} made an incorrect accusation and was eliminated.`;
        
        setGameEvents(prev => [...prev, eventText]);
        
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      } else if (lastMessage.event === 'MOVE') {
        // Move event - add to event feed
        const mover = lastMessage.playerId || 'Someone';
        const room = lastMessage.room || '?';
        
        setGameEvents(prev => [...prev, `${mover} moved to ${room}`]);
        
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      } else if (lastMessage.event === 'TURN') {
        // Turn advance event
        setGameEvents(prev => [...prev, 'Turn advanced']);
        
        if (lastMessage.state) {
          setGameState(lastMessage.state);
        }
      } else if (lastMessage.state) {
        setGameState(lastMessage.state);
      }
    }

    // Handle DISPROVE_REQUEST (broadcast message, check if we're the disprover)
    if (lastMessage.type === 'DISPROVE_REQUEST') {
      console.log('[usePlayer] DISPROVE_REQUEST received:', lastMessage);
      console.log('[usePlayer] Current playerId:', playerId);
      console.log('[usePlayer] Disprover in message:', lastMessage.disprover);
      console.log('[usePlayer] Match?', lastMessage.disprover === playerId);
      
      // Only show modal if current player is the disprover
      if (lastMessage.disprover === playerId) {
        const suggester = lastMessage.suggester || 'Someone';
        const suspect = lastMessage.suspect || '?';
        const weapon = lastMessage.weapon || '?';
        const room = lastMessage.room || '?';
        const candidateCards = lastMessage.candidateCards || '';
        const matchingCards = candidateCards.split(',').filter(Boolean);
        
        console.log('[usePlayer] Setting disprove prompt with matching cards:', matchingCards);
        
        setDisprovePrompt({
          suggester,
          suspect,
          weapon,
          room,
          matchingCards
        });
      } else {
        console.log('[usePlayer] Not the disprover, ignoring DISPROVE_REQUEST');
      }
    }
  }, [lastMessage, playerId]);

  const joinLobby = (playerName: string, targetGameId = "default") => {
    setPlayerId(playerName);
    setGameId(targetGameId);
    send({
      type: 'JOIN_LOBBY',
      gameId: targetGameId,
      playerId: playerName,
      payload: {}
    });
  };

  const selectCharacter = (character: string) => {
    if (!playerId || !gameId) return;
    send({
      type: 'SELECT_CHARACTER',
      gameId,
      playerId,
      payload: { character }
    });
  };

  const unselectCharacter = () => {
    if (!playerId || !gameId) return;
    send({
      type: 'UNSELECT_CHARACTER',
      gameId,
      playerId,
      payload: {}
    });
  };

  const setReady = (ready: boolean) => {
    if (!playerId || !gameId) return;
    send({
      type: 'SET_READY',
      gameId,
      playerId,
      payload: { ready }
    });
  };

  const startGame = () => {
    if (!playerId || !gameId) return;
    send({
      type: 'START_GAME',
      gameId,
      playerId,
      payload: {}
    });
  };

  // Derived state
  const myCharacter = lobbyState && playerId 
    ? lobbyState.selections[playerId] || null 
    : null;
  
  const isReady = lobbyState && playerId 
    ? lobbyState.ready[playerId] || false 
    : false;

  return {
    connected,
    playerId,
    gameId,
    gameState,
    lobbyState,
    isInLobby,
    isInGame,
    error,
    myCharacter,
    isReady,
    gameEvents,
    disprovePrompt,
    clearDisprovePrompt: () => setDisprovePrompt(null),
    joinLobby,
    selectCharacter,
    unselectCharacter,
    setReady,
    startGame,
  };
}
