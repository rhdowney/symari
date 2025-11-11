import { useState, useMemo, useCallback, useEffect } from 'react';
import { Board } from "../components/Board";
import { JoinScreen } from "../components/JoinScreen";
import { Lobby } from "../components/Lobby";
import { useWebSocket } from "../context/useWebSocket";
import { usePlayer } from "../store/usePlayer";
import type { Card } from "../api/types";
import { getValidMoves, canMakeSuggestion, canMakeAccusation, getMoveType } from "../utils/gameLogic";

// Game Board Components
import ToastNotification from "../components/GameBoard/ToastNotification";
import ActionBar from "../components/GameBoard/ActionBar";
import HandPanel from "../components/GameBoard/HandPanel";
import EventFeed from "../components/GameBoard/EventFeed";
import MoveSelectionModal from "../components/GameBoard/MoveSelectionModal";
import SuggestionModal from "../components/GameBoard/SuggestionModal";
import AccusationModal from "../components/GameBoard/AccusationModal";
import SuggestionResultModal from "../components/GameBoard/SuggestionResultModal";
import DisproveModal from "../components/GameBoard/DisproveModal";

export default function GameBoardPage() {
  const { connected, error, send, lastMessage } = useWebSocket();
  const {
    playerId,
    gameId,
    gameState,
    isInLobby,
    isInGame,
    lobbyState,
    myCharacter,
    isReady,
    gameEvents,
    disprovePrompt,
    clearDisprovePrompt,
    joinLobby,
    selectCharacter,
    unselectCharacter,
    setReady,
    startGame,
  } = usePlayer();

  // Local state for modals and game actions
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showAccusationModal, setShowAccusationModal] = useState(false);
  const [showSuggestionResult, setShowSuggestionResult] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState<{
    disprover: string | null;
    revealedCard: string | null;
  } | null>(null);
  const [hasMovedThisTurn, setHasMovedThisTurn] = useState(false);

  // Handle SUGGEST ACK messages (private result with revealed card)
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'ACK' || lastMessage.for !== 'SUGGEST') return;
    
    const disprover = lastMessage.disprover || null;
    const revealedCard = lastMessage.revealedCard || null;
    
    setSuggestionResult({ disprover, revealedCard });
    setShowSuggestionResult(true);
  }, [lastMessage]);

  // Get current player's location from game state
  const getCurrentPlayerLocation = useCallback((): string | null => {
    if (!gameState || !playerId) return null;
    const player = gameState.players.find(p => p.name === playerId);
    
    // Prefer location.name (which could be room or hallway), fall back to room
    if (player?.location?.name) {
      return player.location.name;
    }
    return player?.room || null;
  }, [gameState, playerId]);

  const currentLocation = useMemo(() => {
    return getCurrentPlayerLocation();
  }, [getCurrentPlayerLocation]);

  // Reset hasMovedThisTurn when turn changes
  useEffect(() => {
    if (gameState?.currentPlayer === playerId) {
      // It's now my turn - reset the moved flag
      setHasMovedThisTurn(false);
    }
  }, [gameState?.currentPlayer, playerId]);

  // Calculate valid moves
  const validMoves = useMemo(() => {
    // Don't show valid moves if player has already moved this turn
    if (!currentLocation || !gameState || hasMovedThisTurn) return [];
    // Map players to token format for getValidMoves
    // Use location.name (which works for both rooms and hallways) or fall back to room field
    const tokens = gameState.players.map(p => ({
      playerId: p.name,
      locationId: p.location?.name || p.room || ''
    })).filter(t => t.locationId);
    return getValidMoves(currentLocation, tokens);
  }, [currentLocation, gameState, hasMovedThisTurn]);

  // Get active suspects (characters) in the game
  const activeSuspects = useMemo(() => {
    if (!gameState) return [];
    return gameState.players.map(p => p.character).filter(Boolean);
  }, [gameState]);

  // Game logic values
  const gameLogicValues = useMemo(() => {
    if (!gameState || !playerId) {
      return {
        isMyTurn: false,
        myCards: [] as Card[],
        canSuggest: false
      };
    }
    
    const isMyTurn = gameState.currentPlayer === playerId;
    const myPlayer = gameState.players.find(p => p.name === playerId);
    const myCards = myPlayer?.hand || [];
    const canSuggest = currentLocation ? canMakeSuggestion(currentLocation) : false;
    
    return {
      isMyTurn,
      myCards,
      canSuggest
    };
  }, [gameState, playerId, currentLocation]);

  // Calculate matching cards for disprove
  const matchingCardsForDisprove = useMemo(() => {
    if (!disprovePrompt || !gameLogicValues.myCards) return [];
    
    const { suspect, weapon, room } = disprovePrompt;
    return gameLogicValues.myCards.filter(card => {
      if (card.type === 'SUSPECT' && card.name.toUpperCase() === suspect.toUpperCase()) return true;
      if (card.type === 'WEAPON' && card.name.toUpperCase() === weapon.toUpperCase()) return true;
      if (card.type === 'ROOM' && card.name.toUpperCase() === room.toUpperCase()) return true;
      return false;
    });
  }, [disprovePrompt, gameLogicValues.myCards]);

  // Event handlers
  const handleLocationClick = useCallback((locationId: string) => {
    console.log('Location clicked:', locationId);
    if (!currentLocation || !gameLogicValues.isMyTurn) {
      console.log('Not your turn or no current location');
      return;
    }

    if (!validMoves.includes(locationId)) {
      console.log('Invalid move attempted:', locationId, 'Valid moves:', validMoves);
      return;
    }

    // Valid move - execute immediately
    console.log('Valid move selected, executing:', locationId);
    
    if (!playerId || !gameId) return;
    
    // Mark that player has moved this turn
    setHasMovedThisTurn(true);
    
    // Determine the move type based on current and target locations
    const moveType = getMoveType(currentLocation, locationId);
    
    // Send appropriate message based on move type
    if (moveType === 'MOVE_TO_HALLWAY') {
      send({
        type: 'MOVE_TO_HALLWAY',
        gameId,
        playerId,
        payload: { hallway: locationId, hallwayId: locationId, id: locationId }
      });
    } else if (moveType === 'MOVE_FROM_HALLWAY') {
      send({
        type: 'MOVE_FROM_HALLWAY',
        gameId,
        playerId,
        payload: { room: locationId, to: locationId }
      });
    } else {
      // Room to room (direct or secret passage)
      send({
        type: 'MOVE',
        gameId,
        playerId,
        payload: { to: locationId, room: locationId }
      });
    }
  }, [currentLocation, validMoves, gameLogicValues.isMyTurn, playerId, gameId, send]);

  const handleSelectMove = useCallback((locationId: string) => {
    if (!playerId || !gameId || !currentLocation) return;
    
    // Determine the move type based on current and target locations
    const moveType = getMoveType(currentLocation, locationId);
    
    // Send appropriate message based on move type
    if (moveType === 'MOVE_TO_HALLWAY') {
      send({
        type: 'MOVE_TO_HALLWAY',
        gameId,
        playerId,
        payload: { hallway: locationId, hallwayId: locationId, id: locationId }
      });
    } else if (moveType === 'MOVE_FROM_HALLWAY') {
      send({
        type: 'MOVE_FROM_HALLWAY',
        gameId,
        playerId,
        payload: { room: locationId, to: locationId }
      });
    } else {
      // Room to room (direct or secret passage)
      send({
        type: 'MOVE',
        gameId,
        playerId,
        payload: { to: locationId, room: locationId }
      });
    }
    setShowMoveModal(false);
  }, [send, playerId, gameId, currentLocation]);

  const handleSuggest = useCallback(() => {
    if (!currentLocation || !playerId || !gameId) return;
    
    if (gameLogicValues.canSuggest) {
      setShowSuggestionModal(true);
    }
  }, [currentLocation, gameLogicValues.canSuggest, playerId, gameId]);
  
  const handleSubmitSuggestion = useCallback((suspect: string, weapon: string, room: string) => {
    if (!playerId || !gameId) return;
    
    send({
      type: 'SUGGEST',
      gameId,
      playerId,
      payload: { suspect, weapon, room }
    });
  }, [send, playerId, gameId]);
  
  const handleAccuse = useCallback(() => {
    if (!playerId || !gameId) return;
    
    if (canMakeAccusation()) {
      setShowAccusationModal(true);
    }
  }, [playerId, gameId]);

  const handleSubmitAccusation = useCallback((suspect: string, weapon: string, room: string) => {
    if (!playerId || !gameId) return;
    
    send({
      type: 'ACCUSE',
      gameId,
      playerId,
      payload: { suspect, weapon, room }
    });
  }, [send, playerId, gameId]);

  const handleEndTurn = useCallback(() => {
    if (!playerId || !gameId || !gameLogicValues.isMyTurn) return;
    
    send({
      type: 'END_TURN',
      gameId,
      playerId,
      payload: {}
    });
  }, [send, playerId, gameId, gameLogicValues.isMyTurn]);

  // Show join screen if not connected to a game
  if (!playerId || (!isInLobby && !isInGame)) {
    return <JoinScreen onJoin={(name) => joinLobby(name)} connecting={!connected} />;
  }

  // Show lobby screen when in lobby
  if (isInLobby && lobbyState) {
    return (
      <Lobby
        playerId={playerId}
        lobbyState={lobbyState}
        myCharacter={myCharacter}
        onSelectCharacter={selectCharacter}
        onUnselectCharacter={unselectCharacter}
        onSetReady={setReady}
        onStartGame={startGame}
        isReady={isReady}
      />
    );
  }

  // Loading state for game board
  if (!gameState) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Loading Game Board...</p>
          <p className="text-gray-400">Setting up game state...</p>
        </div>
      </div>
    );
  }

  // Mock event feed from game state (server doesn't provide this yet)
  const eventFeed = [
    'Game started!',
    ...gameEvents
  ];

  // Main game board UI
  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <ToastNotification gameState={gameState} currentPlayerId={playerId} />
      
      {/* Connection status header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Clue-Less</h1>
          <p className="text-sm text-gray-400">
            Playing as: {playerId}
            {myCharacter && <span className="font-semibold text-gray-300"> ({myCharacter})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="px-3 py-1 rounded-full bg-red-900 text-red-200 text-sm font-medium">
              ❌ Error: {error}
            </div>
          )}
          {connected && (
            <div className="px-3 py-1 rounded-full bg-green-900 text-green-200 text-sm font-medium">
              ✓ Connected
            </div>
          )}
        </div>
      </div>
      
      {/* Game Board */}
      <div className="flex justify-center mb-6">
        <Board 
          snapshot={gameState}
          onRoomClick={handleLocationClick}
          validMoves={validMoves}
          isMyTurn={gameLogicValues.isMyTurn}
        />
      </div>
      
      {/* Action Bar */}
      <div className="mb-6">
        <ActionBar 
          isMyTurn={gameLogicValues.isMyTurn}
          onSuggest={handleSuggest}
          onAccuse={handleAccuse}
          onEndTurn={handleEndTurn}
          canSuggest={gameLogicValues.canSuggest}
          canAccuse={canMakeAccusation()}
        />
      </div>
      
      {/* Hand Panel */}
      <div className="mb-6">
        <HandPanel cards={gameLogicValues.myCards} />
      </div>
      
      {/* Event Feed */}
      <div className="mb-6">
        <EventFeed events={eventFeed} />
      </div>
      
      {/* Move selection modal */}
      <MoveSelectionModal
          isOpen={showMoveModal}
          validMoves={validMoves}
          onSelectMove={handleSelectMove}
          onClose={() => setShowMoveModal(false)}
        />
        
        {/* Suggestion modal */}
        <SuggestionModal
          isOpen={showSuggestionModal}
          currentRoom={currentLocation || ''}
          activeSuspects={activeSuspects}
          onSubmit={handleSubmitSuggestion}
          onClose={() => setShowSuggestionModal(false)}
        />
        
        {/* Accusation modal */}
        <AccusationModal
          isOpen={showAccusationModal}
          activeSuspects={activeSuspects}
          onSubmit={handleSubmitAccusation}
          onClose={() => setShowAccusationModal(false)}
        />
        
      {/* Suggestion result modal */}
      <SuggestionResultModal
        isOpen={showSuggestionResult}
        disprover={suggestionResult?.disprover || null}
        revealedCard={suggestionResult?.revealedCard || null}
        onClose={() => setShowSuggestionResult(false)}
      />
      
      {/* Disprove modal */}
      <DisproveModal
        isOpen={!!disprovePrompt}
        suggester={disprovePrompt?.suggester || ''}
        suspect={disprovePrompt?.suspect || ''}
        weapon={disprovePrompt?.weapon || ''}
        room={disprovePrompt?.room || ''}
        matchingCards={matchingCardsForDisprove}
        onClose={clearDisprovePrompt}
      />
    </div>
  );
}
