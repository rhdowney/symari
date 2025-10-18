import React from 'react';
import { Copy, Swords } from '../icons';
import PlayerListItem from './PlayerListItem';
import type { GameState, LobbyPlayer } from './LobbyTypes';


//== Main Component: PlayerSidebar ==//
interface PlayerSidebarProps {
  gameState: GameState;
  currentUser: { id: string };
  onReadyToggle: () => void;
  onLeaveLobby: () => void;
  onStartGame: () => void;
  roomCode: string;
}

const PlayerSidebar: React.FC<PlayerSidebarProps> = ({ gameState, currentUser, onReadyToggle, onLeaveLobby, onStartGame, roomCode }) => {
  const { players = [], hostId } = gameState;
  const isHost = currentUser?.id === hostId;
  const currentUserData = players.find((p: LobbyPlayer) => p.id === currentUser?.id);
  const canReady = !!currentUserData?.characterId;
  
  // Game can start if the user is the host, there are at least 2 players, and every player is ready.
  const canStartGame = isHost && players.length >= 2 && players.every((p: LobbyPlayer) => p.isReady);

  const readyButtonText = !canReady 
    ? "Select Character First" 
    : currentUserData?.isReady 
    ? "Cancel Ready" 
    : "Ready Up";

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Players ({players.length}/6)</h3>
      <div className="space-y-3 mb-6 flex-grow">
        {Array.from({ length: 6 }).map((_, index) => {
          const player = players[index];
          return (
            <PlayerListItem 
              key={player?.id || `empty-${index}`} 
              player={player} 
              isCurrentUser={player?.id === currentUser?.id} 
              isHost={player?.id === hostId} 
            />
          );
        })}
      </div>
      <div className="space-y-2">
         {isHost && (
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
            Start Game
          </button>
        )}
        <button
          onClick={onReadyToggle}
          disabled={!canReady}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors ${
            !canReady 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {readyButtonText}
        </button>
        <button 
          onClick={() => navigator.clipboard.writeText(roomCode)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Room Code
        </button>
        <button 
          onClick={onLeaveLobby}
          className="w-full bg-red-800/70 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Leave Lobby
        </button>
        <p className="text-xs text-gray-400 text-center pt-2">
          {isHost ? "All players must be ready to start." : "The host will start the game when everyone is ready."}
        </p>
      </div>
    </div>
  );
};

export default PlayerSidebar;

