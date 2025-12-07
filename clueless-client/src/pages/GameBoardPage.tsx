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
import PlayerStatusPanel from "../components/GameBoard/PlayerStatusPanel";
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
  const [hasSuggestedThisTurn, setHasSuggestedThisTurn] = useState(false);

  // Debug logging for suggestion result state
  useEffect(() => {
    console.log('[GameBoardPage] Suggestion result state:', {
      showSuggestionResult,
      suggestionResult
    });
  }, [showSuggestionResult, suggestionResult]);

  // Handle DISPROVE_REVEAL event (private card reveal to suggester)
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('[GameBoardPage] Message received:', lastMessage.type, lastMessage.event);
    
    if (lastMessage.type !== 'EVENT' || lastMessage.event !== 'DISPROVE_REVEAL') return;
    
    console.log('[GameBoardPage] DISPROVE_REVEAL event - suggester:', lastMessage.suggester, 'playerId:', playerId);
    
    if (lastMessage.suggester !== playerId) {
      console.log('[GameBoardPage] Skipping DISPROVE_REVEAL - not for me');
      return; // Only show to suggester
    }
    
    const disprover = lastMessage.disprover || null;
    const revealedCard = lastMessage.card || null;
    
    console.log('[GameBoardPage] Showing disprove result:', { disprover, revealedCard });
    
    setSuggestionResult({ disprover, revealedCard });
    setShowSuggestionResult(true);
  }, [lastMessage, playerId]);

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

  // Reset hasMovedThisTurn and hasSuggestedThisTurn when turn changes
  useEffect(() => {
    if (gameState?.currentPlayer === playerId) {
      // It's now my turn - reset the moved and suggested flags
      setHasMovedThisTurn(false);
      setHasSuggestedThisTurn(false);
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

  // Get all suspects (all 6 Clue characters, not just players in game)
  const activeSuspects = useMemo(() => {
    // All 6 canonical suspects from Clue game
    return ['GREEN', 'PEACOCK', 'PLUM', 'SCARLET', 'MUSTARD', 'WHITE'];
  }, []);

  // Game logic values
  const gameLogicValues = useMemo(() => {
    if (!gameState || !playerId) {
      return {
        isMyTurn: false,
        myCards: [] as Card[],
        canSuggest: false,
        mustExitRoom: false
      };
    }
    
    const isMyTurn = gameState.currentPlayer === playerId;
    const myPlayer = gameState.players.find(p => p.name === playerId);
    const myCards = myPlayer?.hand || [];
    const mustExitRoom = myPlayer?.mustExit || false;
    const canSuggest = currentLocation 
      ? canMakeSuggestion(currentLocation) && !hasSuggestedThisTurn && !mustExitRoom
      : false;
    
    return {
      isMyTurn,
      myCards,
      canSuggest,
      mustExitRoom
    };
  }, [gameState, playerId, currentLocation, hasSuggestedThisTurn]);

  // Get matching cards from disprove prompt (server already calculated them)
  const matchingCardsForDisprove = useMemo(() => {
    if (!disprovePrompt || !disprovePrompt.matchingCards || !gameLogicValues.myCards) return [];
    
    // Convert card names from server to card objects
    return disprovePrompt.matchingCards
      .map(cardName => gameLogicValues.myCards?.find(c => c.name.toUpperCase() === cardName.toUpperCase()))
      .filter((card): card is NonNullable<typeof card> => card !== undefined);
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
    
    // Mark that we've suggested this turn (mirrors server's hasSuggestedThisTurn flag)
    setHasSuggestedThisTurn(true);
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
    <div className="bg-gray-900 min-h-screen text-white">
      <ToastNotification gameState={gameState} currentPlayerId={playerId} />
      
      {/* Connection status header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
      </div>
      
      {/* Main 3-Column Layout - Desktop Only */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Hand (Sticky) */}
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-6">
              <HandPanel cards={gameLogicValues.myCards} />
            </div>
          </aside>
          
          {/* Center - Game Board + Action Bar */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Game Board */}
            <div className="flex justify-center">
              <Board 
                snapshot={gameState}
                onRoomClick={handleLocationClick}
                validMoves={validMoves}
                isMyTurn={gameLogicValues.isMyTurn}
              />
            </div>
            
            {/* Action Bar */}
            <div>
              <ActionBar 
                isMyTurn={gameLogicValues.isMyTurn}
                onSuggest={handleSuggest}
                onAccuse={handleAccuse}
                onEndTurn={handleEndTurn}
                canSuggest={gameLogicValues.canSuggest}
                canAccuse={canMakeAccusation()}
                mustExitRoom={gameLogicValues.mustExitRoom}
              />
            </div>
          </main>
          
          {/* Right Sidebar - Players + Event Feed */}
          <aside className="w-80 flex-shrink-0 space-y-6">
            <PlayerStatusPanel 
              gameState={gameState}
              currentPlayerId={playerId}
            />
            <EventFeed events={eventFeed} />
          </aside>
        </div>
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
        onSelectCard={(cardName: string) => {
          if (!playerId || !gameId || !disprovePrompt) return;
          send({
            type: 'DISPROVE_RESPONSE',
            gameId,
            playerId,
            payload: {
              card: cardName,
              chosen: cardName,
              chosenCard: cardName,
              suggester: disprovePrompt.suggester
            }
          });
        }}
        onClose={clearDisprovePrompt}
      />
    </div>
  );
}
