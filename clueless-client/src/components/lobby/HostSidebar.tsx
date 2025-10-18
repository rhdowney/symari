import React from 'react';
import { Swords } from '../icons';
import PlayerListItem from './PlayerListItem';
import type { GameState } from './LobbyTypes';

interface HostSidebarProps {
  gameState: GameState;
  onReadyToggle: () => void;
  onStartGame: () => void;
  onLeaveLobby: () => void;
  currentUser: { id: string };
  pendingAction: boolean;
}

const HostSidebar: React.FC<HostSidebarProps> = ({
  gameState,
  onReadyToggle,
  onStartGame,
  onLeaveLobby,
  currentUser,
  pendingAction,
}) => {
  const { players = [] } = gameState;
  const playersReady = players.filter((p) => p.isReady).length;
  const currentUserData = players.find((p) => p.id === currentUser.id);
  const canReady = !!currentUserData?.characterId;
  const canStartGame = players.length >= 2 && playersReady === players.length && !pendingAction;

  // Button text based on server state (matching GameLobby exactly)
  const getReadyButtonText = () => {
    if (!canReady) return "Select Character First";
    if (currentUserData?.isReady) return "Cancel Ready";
    return "Ready";
  };
  
  const readyButtonText = getReadyButtonText();

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-300">Players Joined</p>
          <p className="text-2xl font-bold text-white">{players.length} / 6</p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-300">Players Ready</p>
          <p className="text-2xl font-bold text-white">
            {playersReady} / {players.length}
          </p>
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-4">Player Status</h3>
      <div className="space-y-3 mb-6 flex-grow">
        {Array.from({ length: 6 }).map((_, index) => {
          const player = players[index];
          return (
            <PlayerListItem
              key={player?.id || `empty-${index}`}
              player={player}
              isCurrentUser={player?.id === currentUser.id}
              isHost={player?.id === gameState.hostId}
            />
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-xs text-center text-gray-400 h-4 mb-1">
          {canStartGame ? 'All requirements met. Ready to start!' : ''}
        </p>
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
          onClick={onStartGame}
          disabled={!canStartGame}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
            !canStartGame
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <Swords className="w-4 h-4 mr-2" />
          {pendingAction ? 'Starting...' : 'Start Game'}
        </button>
        <button
          onClick={onLeaveLobby}
          className="w-full bg-red-800/70 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
};

export default HostSidebar;
