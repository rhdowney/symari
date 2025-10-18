import PlayerToken from './PlayerToken';
import type { GameState } from '../../types/game';
import { ALL_LOCATIONS } from '../../utils/gameLogic';

interface BoardGridProps {
  gameState: GameState;
  onCellClick: (location: string) => void;
}

export default function BoardGrid({ gameState, onCellClick }: BoardGridProps) {
  // 5x5 grid representing the Clue-Less board
  const gridLayout = [
    ['STUDY', 'STUDY_HALL', 'HALL', 'HALL_LOUNGE', 'LOUNGE'],
    ['STUDY_LIBRARY', 'x', 'HALL_BILLIARD', 'x', 'LOUNGE_DINING'],
    ['LIBRARY', 'LIBRARY_BILLIARD', 'BILLIARD_ROOM', 'BILLIARD_DINING', 'DINING_ROOM'],
    ['LIBRARY_CONSERVATORY', 'x', 'BILLIARD_BALLROOM', 'x', 'DINING_KITCHEN'],
    ['CONSERVATORY', 'CONSERVATORY_BALLROOM', 'BALLROOM', 'BALLROOM_KITCHEN', 'KITCHEN']
  ];

  // Room-specific styling and icons
  const getRoomStyle = (roomId: string) => {
    switch (roomId) {
      case 'STUDY':
        return 'bg-gradient-to-br from-amber-200 to-amber-300 border-amber-400';
      case 'HALL':
        return 'bg-gradient-to-br from-stone-200 to-stone-300 border-stone-400';
      case 'LOUNGE':
        return 'bg-gradient-to-br from-red-200 to-red-300 border-red-400';
      case 'LIBRARY':
        return 'bg-gradient-to-br from-green-200 to-green-300 border-green-400';
      case 'BILLIARD_ROOM':
        return 'bg-gradient-to-br from-emerald-200 to-emerald-300 border-emerald-400';
      case 'DINING_ROOM':
        return 'bg-gradient-to-br from-orange-200 to-orange-300 border-orange-400';
      case 'CONSERVATORY':
        return 'bg-gradient-to-br from-teal-200 to-teal-300 border-teal-400';
      case 'BALLROOM':
        return 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-400';
      case 'KITCHEN':
        return 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-400';
      default:
        return 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400';
    }
  };

  const getRoomIcon = (roomId: string) => {
    switch (roomId) {
      case 'STUDY':
        return '📚';
      case 'HALL':
        return '🏛️';
      case 'LOUNGE':
        return '🛋️';
      case 'LIBRARY':
        return '📖';
      case 'BILLIARD_ROOM':
        return '🎱';
      case 'DINING_ROOM':
        return '🍽️';
      case 'CONSERVATORY':
        return '🌿';
      case 'BALLROOM':
        return '💃';
      case 'KITCHEN':
        return '👨‍🍳';
      default:
        return '';
    }
  };

  const getCellContent = (row: number, col: number) => {
    const cellId = gridLayout[row][col];
    
    // Skip invalid cells
    if (cellId === 'x') return null;
    
    // Get player tokens in this location
    const tokensHere = gameState.playerTokens.filter(token => token.locationId === cellId);
    
    const location = ALL_LOCATIONS[cellId as keyof typeof ALL_LOCATIONS];
    const isRoom = location?.type === 'ROOM';
    const isHallway = location?.type === 'HALLWAY';
    
    // Determine hallway orientation based on position
    const isHorizontalHallway = (row % 2 === 0 && col % 2 === 1); // Even rows, odd columns
    const isVerticalHallway = (row % 2 === 1 && col % 2 === 0); // Odd rows, even columns
    
    if (isHallway) {
      // Hallway: light grey, positioned to connect rooms
      return (
        <div
          key={`${row}-${col}`}
          className={`
            relative cursor-pointer transition-colors border-2
            bg-gray-300 border-gray-400 hover:bg-gray-200
            ${tokensHere.length > 0 ? 'ring-2 ring-blue-400' : ''}
            flex items-center justify-center
          `}
          style={{
            height: isHorizontalHallway ? '2.5rem' : '7rem',
            width: isVerticalHallway ? '2.5rem' : '7rem',
            margin: 'auto'
          }}
          onClick={() => onCellClick(cellId)}
        >
          {/* Player tokens in hallway */}
          <div className="absolute inset-0 flex justify-center items-center">
            {tokensHere.map((token, index) => (
              <PlayerToken
                key={token.playerId}
                characterId={token.characterId}
                className={`
                  ${index > 0 ? 'scale-75 -ml-2' : ''}
                `}
              />
            ))}
          </div>
          
          {/* Connection indicators */}
          {isHorizontalHallway && (
            <>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-gray-500" />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-gray-500" />
            </>
          )}
          {isVerticalHallway && (
            <>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gray-500" />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gray-500" />
            </>
          )}
        </div>
      );
    }

    if (isRoom) {
      // Room: themed styling with centered text and icon
      return (
        <div
          key={`${row}-${col}`}
          className={`
            relative cursor-pointer transition-colors border-2
            ${getRoomStyle(cellId)}
            ${tokensHere.length > 0 ? 'ring-2 ring-blue-400' : ''}
            hover:brightness-110
          `}
          style={{ height: '5.5rem', width: '5.5rem' }} // Larger size for better text visibility
          onClick={() => onCellClick(cellId)}
        >
          {/* Room name and icon - centered with higher z-index */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
            <div className="text-lg mb-1">{getRoomIcon(cellId)}</div>
            <div className="text-xs font-bold text-gray-800 leading-tight bg-white bg-opacity-80 px-1 rounded">
              {location?.name?.replace('_', ' ') || cellId}
            </div>
          </div>
          
          {/* Player tokens in room - positioned at bottom */}
          {tokensHere.length > 0 && (
            <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 justify-center">
              {tokensHere.map((token, index) => (
                <PlayerToken
                  key={token.playerId}
                  characterId={token.characterId}
                  className={`
                    ${index > 1 ? 'scale-75' : ''}
                  `}
                />
              ))}
            </div>
          )}
          
          {/* Secret passages indicator - Underground tunnel entrance */}
          {('hasSecretPassage' in location && location.hasSecretPassage) && (
            <div 
              className="absolute top-1 right-1 w-5 h-5 rounded-full border-2 border-amber-700 bg-gradient-to-br from-amber-600 to-amber-900 shadow-lg cursor-pointer hover:from-amber-500 hover:to-amber-800 transition-all duration-200 group" 
              title={`Secret Tunnel to ${'secretPassageTo' in location ? location.secretPassageTo : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if ('secretPassageTo' in location && location.secretPassageTo) {
                  onCellClick(location.secretPassageTo);
                }
              }}
            >
              {/* Tunnel opening effect */}
              <div className="absolute inset-0.5 rounded-full bg-black opacity-60" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-transparent to-black opacity-80" />
              
              {/* Tunnel entrance indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse opacity-80 group-hover:bg-yellow-200" />
              </div>
              
              {/* Sparkle effect on hover */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity" />
            </div>
          )}
          
          {/* Remove the subtle room border overlay for cleaner look */}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 p-3 rounded-lg relative">
      <div className="grid grid-cols-5 gap-2 items-center justify-items-center relative w-full">
        {gridLayout.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (cell === 'x') {
              return (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className="bg-gray-800"
                  style={{ height: '5.5rem', width: '5.5rem' }} // Match room size
                />
              );
            }
            return getCellContent(rowIndex, colIndex);
          })
        )}
      </div>
    </div>
  );
}