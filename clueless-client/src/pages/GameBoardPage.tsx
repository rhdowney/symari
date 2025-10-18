import React, { useState, useEffect } from 'react';
import type { GameState, CurrentUser } from '../types/game';
import type { WSMessageType } from '../network/ws';
import { getValidMoves, canMakeSuggestion, canMakeAccusation } from '../utils/gameLogic';

import ToastNotification from '../components/GameBoard/ToastNotification';
import BoardGrid from '../components/GameBoard/BoardGrid';
import ActionBar from '../components/GameBoard/ActionBar';
import HandPanel from '../components/GameBoard/HandPanel';
import EventFeed from '../components/GameBoard/EventFeed';
import MoveSelectionModal from '../components/GameBoard/MoveSelectionModal';

//== Main Page Component ==//
const GameBoardPage: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  
  // Step 1: Test basic state setup without complex logic
  useEffect(() => {
    console.log('useEffect running...');
    const mockUser: CurrentUser = { id: `user-${Date.now()}`, name: 'New Player' };
    setCurrentUser(mockUser);
    console.log('currentUser set:', mockUser);
    
    // Restore full mock game state
    const mockGameState: GameState = {
      hostId: mockUser.id,
      status: 'in-game',
      players: [
        {
          id: mockUser.id,
          name: 'New Player',
          characterId: 'SCARLET',
          characterName: 'Miss Scarlet',
          isReady: true,
          hand: [
            { id: 'card1', name: 'Candlestick', type: 'WEAPON' },
            { id: 'card2', name: 'Study', type: 'ROOM' },
            { id: 'card3', name: 'Colonel Mustard', type: 'SUSPECT' }
          ]
        },
        {
          id: 'player-2',
          name: 'Player 2',
          characterId: 'MUSTARD',
          characterName: 'Colonel Mustard',
          isReady: true,
          hand: []
        }
      ],
      playerTokens: [
        { playerId: mockUser.id, characterId: 'SCARLET', locationId: 'STUDY' },
        { playerId: 'player-2', characterId: 'MUSTARD', locationId: 'HALL_LOUNGE' }
      ],
      currentTurnPlayerId: mockUser.id,
      suggestion: null,
      winner: null,
      eventFeed: [
        'Game started!',
        'Miss Scarlet entered the Study',
        'Colonel Mustard is in the Hall-Lounge hallway'
      ],
      gamePhase: 'MOVING'
    };
    
    setGameState(mockGameState);
    console.log('gameState set:', mockGameState);
  }, []);

  if (!gameState || !currentUser) {
    console.log('Still loading...', { gameState, currentUser });
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <p>Loading Game...</p>
      </div>
    );
  }

  console.log('Rendering main game with:', { gameState, currentUser });

  // Add proper handler functions
  const sendMessage = (type: WSMessageType, payload: Record<string, unknown> = {}) => {
    if (!currentUser) return;
    console.log('Sending message:', { type, payload });
    // Mock WebSocket send - just log for now
  };

  const getCurrentPlayerLocation = (): string | null => {
    if (!gameState || !currentUser) return null;
    const playerToken = gameState.playerTokens.find(t => t.playerId === currentUser.id);
    return playerToken?.locationId || null;
  };

  const handleLocationClick = (locationId: string) => {
    console.log('Location clicked:', locationId);
    const currentLocation = getCurrentPlayerLocation();
    if (!currentLocation || !gameState) {
      console.warn('Cannot handle location click: missing current location or game state');
      return;
    }

    const validMoves = getValidMoves(currentLocation, gameState.playerTokens);
    if (validMoves.includes(locationId)) {
      setSelectedLocation(locationId);
      console.log('Valid move selected:', locationId);
    } else {
      console.log('Invalid move attempted:', locationId, 'Valid moves:', validMoves);
    }
  };

  const handleMove = () => {
    if (selectedLocation) {
      sendMessage('MOVE_REQUEST', { targetLocationId: selectedLocation });
      setSelectedLocation(null);
    } else {
      const currentLocation = getCurrentPlayerLocation();
      if (currentLocation && gameState) {
        const validMoves = getValidMoves(currentLocation, gameState.playerTokens);
        if (validMoves.length > 0) {
          setShowMoveModal(true);
        }
      }
    }
  };

  const handleSelectMove = (locationId: string) => {
    sendMessage('MOVE_REQUEST', { targetLocationId: locationId });
    setShowMoveModal(false);
  };

  const handleSuggest = () => {
    const currentLocation = getCurrentPlayerLocation();
    if (!currentLocation || !gameState) return;
    
    const validMoves = getValidMoves(currentLocation, gameState.playerTokens);
    if (canMakeSuggestion(currentLocation, validMoves)) {
      // Mock suggestion - in real app this would open a modal to select cards
      sendMessage('MAKE_SUGGESTION', { suspectId: 'MUSTARD', weaponId: 'WRENCH', roomId: currentLocation });
    }
  };
  
  const handleAccuse = () => {
    if (canMakeAccusation()) {
      // Mock accusation - in real app this would open a modal to select cards
      sendMessage('MAKE_ACCUSE', { suspectId: 'MUSTARD', weaponId: 'WRENCH', roomId: 'STUDY' });
    }
  };

  // Calculate game logic values
  const isMyTurn = gameState.currentTurnPlayerId === currentUser.id;
  const myCards = gameState.players.find(p => p.id === currentUser.id)?.hand || [];
  const currentLocation = getCurrentPlayerLocation();
  const validMoves = currentLocation ? getValidMoves(currentLocation, gameState.playerTokens) : [];
  const canSuggest = currentLocation ? canMakeSuggestion(currentLocation, validMoves) : false;

  return (
    <div className="bg-gray-900 h-screen text-white p-2 flex flex-col overflow-hidden">
      <div className="w-full mx-auto flex flex-col h-full">
        <ToastNotification gameState={gameState} currentUser={currentUser} />
        
        {/* Top - Board Grid with constrained height */}
        <div className="flex items-center justify-center" style={{ height: '60%' }}>
          <BoardGrid 
            gameState={gameState} 
            onCellClick={handleLocationClick}
          />
        </div>
        
        {/* Middle - ActionBar */}
        <div className="flex-shrink-0 my-2">
          <ActionBar 
            isMyTurn={isMyTurn}
            onMove={handleMove}
            onSuggest={handleSuggest}
            onAccuse={handleAccuse}
            canMove={validMoves.length > 0}
            canSuggest={canSuggest}
            canAccuse={canMakeAccusation()}
          />
        </div>
        
        {/* Bottom - HandPanel and EventFeed side by side with constrained height */}
        <div className="flex gap-4 flex-shrink-0" style={{ height: '30%' }}>
          <HandPanel cards={myCards} />
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
