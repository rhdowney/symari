import type { GameSnapshot } from '../../api/types';

interface PlayerStatusPanelProps {
  gameState: GameSnapshot;
  currentPlayerId: string;
}

// Character emoji mapping
const CHARACTER_EMOJI: Record<string, string> = {
  'SCARLET': '🔴',
  'MUSTARD': '🟡',
  'WHITE': '⚪',
  'GREEN': '🟢',
  'PEACOCK': '🔵',
  'PLUM': '🟣',
};

const getCharacterEmoji = (character: string): string => {
  if (!character) return '🕵️';
  const upper = character.toUpperCase();
  return CHARACTER_EMOJI[upper] || '🕵️';
};

export default function PlayerStatusPanel({ gameState, currentPlayerId }: PlayerStatusPanelProps) {
  if (!gameState) return null;

  const currentTurnPlayer = gameState.currentPlayer;
  const activePlayers = gameState.players.filter(p => p.active);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <span>👥</span>
        <span>Players</span>
      </h3>
      
      <div className="space-y-2">
        {activePlayers.map((player) => {
          const isCurrentPlayer = player.name === currentPlayerId;
          const isTheirTurn = player.name === currentTurnPlayer;
          const location = player.location?.name || player.room || 'Unknown';
          
          return (
            <div
              key={player.name}
              className={`p-3 rounded-lg border-2 transition-all ${
                isTheirTurn
                  ? 'bg-green-900/30 border-green-500 shadow-lg shadow-green-500/20'
                  : 'bg-gray-900/50 border-gray-700'
              } ${
                isCurrentPlayer
                  ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {getCharacterEmoji(player.character)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate">
                        {player.name}
                      </span>
                      {isCurrentPlayer && (
                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {player.character}
                    </div>
                  </div>
                </div>
                
                {isTheirTurn && (
                  <div className="flex-shrink-0">
                    <div className="animate-pulse text-green-400 text-lg">
                      🎯
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span>📍</span>
                  <span className="truncate">{location}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {gameState.gameOver && (
        <div className="mt-4 p-3 bg-purple-900/50 border-2 border-purple-500 rounded-lg text-center">
          <div className="text-purple-300 font-semibold text-sm">
            🏆 Game Over
          </div>
        </div>
      )}
    </div>
  );
}
