import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { GameState, CurrentUser } from '../types/game';
import type { WSMessageType } from '../network/ws';
import { getValidMoves, canMakeSuggestion, canMakeAccusation } from '../utils/gameLogic';
import { useWebSocket } from '../context';

import ToastNotification from '../components/GameBoard/ToastNotification';
import BoardGrid from '../components/GameBoard/BoardGrid';
import ActionBar from '../components/GameBoard/ActionBar';
import HandPanel from '../components/GameBoard/HandPanel';
import EventFeed from '../components/GameBoard/EventFeed';
import MoveSelectionModal from '../components/GameBoard/MoveSelectionModal';

// Constants for better maintainability
const LAYOUT_CONFIG = {
  BOARD_HEIGHT_PERCENT: '60%',
  BOTTOM_PANEL_HEIGHT_PERCENT: '30%',
  DEFAULT_GAME_ID: 'CLUE-2024'
} as const;

// Type guards for better type safety
const isValidGameState = (state: unknown): state is GameState => {
  if (!state || typeof state !== 'object') return false;
  const gameState = state as Record<string, unknown>;
  return (
    Array.isArray(gameState.players) &&
    Array.isArray(gameState.playerTokens) &&
    typeof gameState.currentTurnPlayerId === 'string'
  );
};

//== Main Page Component ==//
const GameBoardPage: React.FC = () => {
  const ws = useWebSocket();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Step 2: Memoized sendMessage function (must be defined first)
  const sendMessage = useCallback((type: WSMessageType, payload: Record<string, unknown> = {}) => {
    if (!currentUser || !gameState) {
      console.warn('Cannot send message: missing user or game state');
      return;
    }
    
    console.log('Sending message:', { type, payload });
    ws.send({
      type: type,
      gameId: gameState.id || LAYOUT_CONFIG.DEFAULT_GAME_ID,
      playerId: currentUser.id,
      payload: payload
    });
  }, [ws, currentUser, gameState]);

  // Memoized helper functions for performance
  const getCurrentPlayerLocation = useCallback((): string | null => {
    if (!gameState || !currentUser) return null;
    const playerToken = gameState.playerTokens.find(t => t.playerId === currentUser.id);
    return playerToken?.locationId || null;
  }, [gameState, currentUser]);

  // Memoized calculations for performance
  const currentLocation = useMemo(() => {
    return getCurrentPlayerLocation();
  }, [getCurrentPlayerLocation]);

  const validMoves = useMemo(() => {
    return currentLocation ? getValidMoves(currentLocation, gameState?.playerTokens || []) : [];
  }, [currentLocation, gameState?.playerTokens]);

  const gameLogicValues = useMemo(() => {
    if (!gameState || !currentUser) {
      return {
        isMyTurn: false,
        myCards: [],
        canSuggest: false
      };
    }
    
    const isMyTurn = gameState.currentTurnPlayerId === currentUser.id;
    const myCards = gameState.players.find(p => p.id === currentUser.id)?.hand || [];
    const canSuggest = currentLocation ? canMakeSuggestion(currentLocation, validMoves) : false;
    
    return {
      isMyTurn,
      myCards,
      canSuggest
    };
  }, [gameState, currentUser, currentLocation, validMoves]);

  // Memoized event handlers
  const handleLocationClick = useCallback((locationId: string) => {
    console.log('Location clicked:', locationId);
    if (!currentLocation) {
      console.warn('Cannot handle location click: no current location');
      return;
    }

    if (validMoves.includes(locationId)) {
      setSelectedLocation(locationId);
      console.log('Valid move selected:', locationId);
    } else {
      console.log('Invalid move attempted:', locationId, 'Valid moves:', validMoves);
    }
  }, [currentLocation, validMoves]);

  const handleMove = useCallback(() => {
    if (selectedLocation) {
      sendMessage('MOVE_REQUEST', { targetLocationId: selectedLocation });
      setSelectedLocation(null);
    } else {
      if (currentLocation && validMoves.length > 0) {
        setShowMoveModal(true);
      }
    }
  }, [selectedLocation, currentLocation, validMoves, sendMessage]);

  const handleSelectMove = useCallback((locationId: string) => {
    sendMessage('MOVE_REQUEST', { targetLocationId: locationId });
    setShowMoveModal(false);
  }, [sendMessage]);

  const handleSuggest = useCallback(() => {
    if (!currentLocation) return;
    
    if (gameLogicValues.canSuggest) {
      // In a real app this would open a modal to select cards
      console.log('Opening suggestion modal...');
      // Mock sending suggestion for now:
      sendMessage('MAKE_SUGGESTION', { suspectId: 'MUSTARD', weaponId: 'WRENCH', roomId: currentLocation });
    }
  }, [currentLocation, gameLogicValues.canSuggest, sendMessage]);
  
  const handleAccuse = useCallback(() => {
    if (canMakeAccusation()) {
      // In a real app this would open a modal to select cards
      console.log('Opening accusation modal...');
      // Mock sending accusation for now:
      sendMessage('MAKE_ACCUSE', { suspectId: 'MUSTARD', weaponId: 'WRENCH', roomId: 'STUDY' });
    }
  }, [sendMessage]);
  
  // Step 1: Subscribe to game updates and set up the user
  useEffect(() => {
    // Enhanced user identity management with error handling
    let user: CurrentUser;
    try {
      const storedUserId = sessionStorage.getItem('clue_user');
      const userId = storedUserId && storedUserId.trim() ? storedUserId : `user-${Date.now()}`;
      
      user = { 
        id: userId, 
        name: sessionStorage.getItem('clue_user_name') || 'Player' 
      };
      
      // Store the user ID for future sessions
      sessionStorage.setItem('clue_user', userId);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error managing user session:', error);
      // Fallback user creation
      user = { 
        id: `user-${Date.now()}`, 
        name: 'Player' 
      };
      setCurrentUser(user);
    }

    // Enhanced error handling for game state updates
    const handleGameState = (newGameState: unknown) => {
      try {
        // Type validation for better type safety
        if (!newGameState || typeof newGameState !== 'object') {
          console.error('Invalid game state received: not an object');
          return;
        }
        
        const gameState = newGameState as GameState;
        
        // Use type guard for validation
        if (!isValidGameState(newGameState)) {
          console.error('Invalid game state: failed type validation');
          return;
        }
        
        console.log('GameBoard received valid state update:', gameState);
        setGameState(gameState);
      } catch (error) {
        console.error('Error processing game state update:', error);
      }
    };
    
    ws.on('GAME_STATE_UPDATE', handleGameState);

    // Request the initial state for the game board
    ws.send({ 
      type: 'REQUEST_INITIAL_STATE', 
      gameId: LAYOUT_CONFIG.DEFAULT_GAME_ID,
      playerId: user.id, 
      payload: {}
    });

    return () => {
      ws.off('GAME_STATE_UPDATE', handleGameState);
    };
  }, [ws]);

  // Separate useEffect for fallback game state
  useEffect(() => {
    if (!currentUser) return;
    
    const fallbackTimer = setTimeout(() => {
      if (!gameState) {
        console.log('Creating fallback game state...');
        const fallbackGameState: GameState = {
          id: 'fallback-game',
          hostId: currentUser.id,
          status: 'in-game',
          players: [
            {
              id: currentUser.id,
              name: currentUser.name,
              characterId: 'SCARLET',
              characterName: 'Miss Scarlet',
              isReady: true,
              hand: [
                { id: 'card1', name: 'Candlestick', type: 'WEAPON' },
                { id: 'card2', name: 'Study', type: 'ROOM' }
              ]
            }
          ],
          playerTokens: [
            { playerId: currentUser.id, characterId: 'SCARLET', locationId: 'STUDY' }
          ],
          currentTurnPlayerId: currentUser.id,
          suggestion: null,
          winner: null,
          eventFeed: [
            'Game started!',
            'Miss Scarlet entered the Study'
          ],
          gamePhase: 'MOVING'
        };
        setGameState(fallbackGameState);
      }
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [currentUser, gameState]);



  if (!gameState || !currentUser) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Loading Game Board...</p>
          <p className="text-gray-400">Setting up game state...</p>
        </div>
      </div>
    );
  }

  // == Optimized functions are defined above ==



  return (
    <div className="bg-gray-900 h-screen text-white p-2 flex flex-col overflow-hidden">
      <div className="w-full mx-auto flex flex-col h-full">
        <ToastNotification gameState={gameState} currentUser={currentUser} />
        
        <div className="flex items-center justify-center" style={{ height: LAYOUT_CONFIG.BOARD_HEIGHT_PERCENT }}>
          <BoardGrid 
            gameState={gameState} 
            onCellClick={handleLocationClick}
          />
        </div>
        
        <div className="flex-shrink-0 my-2">
          <ActionBar 
            isMyTurn={gameLogicValues.isMyTurn}
            onMove={handleMove}
            onSuggest={handleSuggest}
            onAccuse={handleAccuse}
            canMove={validMoves.length > 0 || !!selectedLocation} // Can move if moves available OR one is selected
            canSuggest={gameLogicValues.canSuggest}
            canAccuse={canMakeAccusation()}
          />
        </div>
        
        <div className="flex gap-4 flex-shrink-0" style={{ height: LAYOUT_CONFIG.BOTTOM_PANEL_HEIGHT_PERCENT }}>
          <HandPanel cards={gameLogicValues.myCards} />
          <EventFeed events={gameState.eventFeed} />
        </div>
        
        <MoveSelectionModal
          isOpen={showMoveModal}
          validMoves={validMoves}
          onSelectMove={handleSelectMove}
          onClose={() => setShowMoveModal(false)}
        />
      </div>
    </div>
  );
}

export default GameBoardPage;
