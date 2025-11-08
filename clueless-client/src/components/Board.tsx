import type { GameSnapshot, PlayerView } from '../api/types';

type Props = {
  snapshot?: GameSnapshot;
  onRoomClick?: (location: string) => void;
  validMoves?: string[];
  isMyTurn?: boolean;
};

// Character to emoji mapping (friendly names)
const CHARACTER_EMOJI: Record<string, string> = {
  'Miss Scarlet': '🔴',
  'Colonel Mustard': '🟡',
  'Mrs. White': '⚪',
  'Mr. Green': '🟢',
  'Mrs. Peacock': '🔵',
  'Professor Plum': '🟣',
};

// Map server character codes (e.g. GREEN) to friendly names used in the UI
const CHARACTER_NAME_FROM_CODE: Record<string, string> = {
  SCARLET: 'Miss Scarlet',
  MUSTARD: 'Colonel Mustard',
  WHITE: 'Mrs. White',
  GREEN: 'Mr. Green',
  PEACOCK: 'Mrs. Peacock',
  PLUM: 'Professor Plum',
};

function getCharacterEmoji(character: string): string {
  if (!character) return '';
  // If the server already sent a friendly name, use it directly
  if (CHARACTER_EMOJI[character]) return CHARACTER_EMOJI[character];
  // Otherwise, try treating it as a server code and map to friendly name
  const upper = character.toUpperCase();
  const friendly = CHARACTER_NAME_FROM_CODE[upper];
  if (friendly && CHARACTER_EMOJI[friendly]) return CHARACTER_EMOJI[friendly];
  // Fallback: return the raw character string (so something shows)
  return character;
}

export function Board({ snapshot, onRoomClick, validMoves = [], isMyTurn = false }: Props) {
  // 5x5 grid representing the Clue-Less board
  // Using server's canonical hallway IDs (alphabetically sorted)
  const gridLayout = [
    ['STUDY', 'HALL_STUDY', 'HALL', 'HALL_LOUNGE', 'LOUNGE'],
    ['LIBRARY_STUDY', 'x', 'BILLIARD_HALL', 'x', 'DINING_LOUNGE'],
    ['LIBRARY', 'BILLIARD_LIBRARY', 'BILLIARD', 'BILLIARD_DINING', 'DINING'],
    ['CONSERVATORY_LIBRARY', 'x', 'BALLROOM_BILLIARD', 'x', 'DINING_KITCHEN'],
    ['CONSERVATORY', 'BALLROOM_CONSERVATORY', 'BALLROOM', 'BALLROOM_KITCHEN', 'KITCHEN']
  ];

  // Map server room names to grid cell IDs
  const roomNameMap: Record<string, string> = {
    'STUDY': 'STUDY',
    'HALL': 'HALL',
    'LOUNGE': 'LOUNGE',
    'LIBRARY': 'LIBRARY',
    'BILLIARD': 'BILLIARD',
    'DINING': 'DINING',
    'CONSERVATORY': 'CONSERVATORY',
    'BALLROOM': 'BALLROOM',
    'KITCHEN': 'KITCHEN',
  };

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
      case 'BILLIARD':
        return 'bg-gradient-to-br from-emerald-200 to-emerald-300 border-emerald-400';
      case 'DINING':
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
      case 'BILLIARD':
        return '🎱';
      case 'DINING':
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

  const getRoomName = (roomId: string) => {
    switch (roomId) {
      case 'STUDY':
        return 'Study';
      case 'HALL':
        return 'Hall';
      case 'LOUNGE':
        return 'Lounge';
      case 'LIBRARY':
        return 'Library';
      case 'BILLIARD':
        return 'Billiard Room';
      case 'DINING':
        return 'Dining Room';
      case 'CONSERVATORY':
        return 'Conservatory';
      case 'BALLROOM':
        return 'Ballroom';
      case 'KITCHEN':
        return 'Kitchen';
      default:
        return roomId.replace(/_/g, ' ');
    }
  };

  // Normalize hallway ID to server's canonical format (alphabetical ordering)
  const getCanonicalHallwayId = (hallwayId: string): string => {
    const parts = hallwayId.split('_');
    if (parts.length !== 2) return hallwayId;
    const [a, b] = parts;
    // Server uses alphabetical ordering
    return a.localeCompare(b) <= 0 ? hallwayId : `${b}_${a}`;
  };

  // Get players in a specific location
  const getPlayersInLocation = (cellId: string): PlayerView[] => {
    if (!snapshot?.players) return [];
    
    // Check if this is a room
    const isRoom = Object.values(roomNameMap).includes(cellId);
    if (isRoom) {
      // Find the server room name
      const serverRoomName = Object.entries(roomNameMap).find(([, mapped]) => mapped === cellId)?.[0];
      if (!serverRoomName) return [];
      
      return snapshot.players.filter(p => {
        // Check room field first
        if (p.room?.toUpperCase() === serverRoomName) return true;
        // Also check location field for rooms
        if (p.location?.type === 'ROOM' && p.location.name.toUpperCase() === serverRoomName) return true;
        return false;
      });
    }
    
    // For hallways, normalize both client and server IDs for comparison
    const canonicalCellId = getCanonicalHallwayId(cellId);
    return snapshot.players.filter(p => {
      if (p.location?.type === 'HALLWAY') {
        const canonicalServerLocation = getCanonicalHallwayId(p.location.name);
        return canonicalServerLocation === canonicalCellId;
      }
      return false;
    });
  };

  const hasSecretPassage = (roomId: string): { has: boolean; to?: string } => {
    const passages: Record<string, string> = {
      'STUDY': 'KITCHEN',
      'KITCHEN': 'STUDY',
      'CONSERVATORY': 'LOUNGE',
      'LOUNGE': 'CONSERVATORY',
    };
    
    if (roomId in passages) {
      return { has: true, to: passages[roomId] };
    }
    return { has: false };
  };

  const getCellContent = (row: number, col: number) => {
    const cellId = gridLayout[row][col];
    
    // Skip invalid cells
    if (cellId === 'x') return null;
    
    // Get players in this location
    const playersHere = getPlayersInLocation(cellId);
    
    const isRoom = Object.values(roomNameMap).includes(cellId);
    const isHallway = cellId.includes('_') && !isRoom;
    
    // Determine hallway orientation based on position
    const isHorizontalHallway = (row % 2 === 0 && col % 2 === 1);
    const isVerticalHallway = (row % 2 === 1 && col % 2 === 0);
    
    // Check if this location is a valid move for the current player
    const canonicalCellId = getCanonicalHallwayId(cellId);
    const isValidMove = isMyTurn && validMoves.some(move => 
      getCanonicalHallwayId(move) === canonicalCellId || move === cellId
    );
    
    if (isHallway) {
      return (
        <div
          key={`${row}-${col}`}
          className={`
            relative cursor-pointer transition-colors border-2
            bg-gray-300 border-gray-400 hover:bg-gray-200
            ${playersHere.length > 0 ? 'ring-2 ring-blue-400' : ''}
            ${isValidMove ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/50 animate-pulse' : ''}
            flex items-center justify-center
          `}
          style={{
            height: isHorizontalHallway ? '2.5rem' : '7rem',
            width: isVerticalHallway ? '2.5rem' : '7rem',
            margin: 'auto',
            // Fallback background/border without Tailwind
            background: isValidMove ? '#86efac' : '#d1d5db', // green-300 if valid, gray-300 otherwise
            ...(isValidMove && {
              boxShadow: '0 0 15px 3px rgba(34, 197, 94, 0.6)',
              border: '3px solid #22c55e'
            })
          }}
          onClick={() => onRoomClick?.(cellId)}
        >
          {/* Player tokens in hallway */}
          <div className="absolute inset-0 flex justify-center items-center">
            {playersHere.length > 0 ? (
              playersHere.map((player, index) => (
                <div
                  key={player.name}
                  className={`text-2xl ${index > 0 ? 'scale-75 -ml-2' : ''}`}
                  title={`${player.name} (${player.character})`}
                >
                  {getCharacterEmoji(player.character)}
                </div>
              ))
            ) : null}
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
      const secretPassage = hasSecretPassage(cellId);
      
      return (
        <div
          key={`${row}-${col}`}
          className={`
            relative cursor-pointer transition-colors border-2
            ${getRoomStyle(cellId)}
            ${playersHere.length > 0 ? 'ring-2 ring-blue-400' : ''}
            ${isValidMove ? 'ring-4 ring-green-500 shadow-xl shadow-green-500/50 animate-pulse' : ''}
            hover:brightness-110
          `}
          style={{
            height: '5.5rem',
            width: '5.5rem',
            ...(isValidMove && {
              boxShadow: '0 0 20px 4px rgba(34, 197, 94, 0.6)',
              border: '3px solid #22c55e'
            })
          }}
          onClick={() => onRoomClick?.(cellId)}
        >
          {/* Room name and icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
            <div className="text-lg mb-1">{getRoomIcon(cellId)}</div>
            <div className="text-xs font-bold text-gray-800 leading-tight bg-white bg-opacity-80 px-1 rounded">
              {getRoomName(cellId)}
            </div>
          </div>
          
          {/* Player tokens in room */}
          {playersHere.length > 0 && (
            <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 justify-center z-20">
              {playersHere.map((player, index) => (
                <div
                  key={player.name}
                  className={`text-xl ${index > 1 ? 'scale-75' : ''}`}
                  title={`${player.name} (${player.character})`}
                >
                  {getCharacterEmoji(player.character)}
                </div>
              ))}
            </div>
          )}
          
          {/* Secret passage indicator */}
          {secretPassage.has && (
            <div 
              className="absolute top-1 right-1 w-5 h-5 rounded-full border-2 border-amber-700 bg-gradient-to-br from-amber-600 to-amber-900 shadow-lg cursor-pointer hover:from-amber-500 hover:to-amber-800 transition-all duration-200 group z-30" 
              title={`Secret Tunnel to ${secretPassage.to}`}
              onClick={(e) => {
                e.stopPropagation();
                if (secretPassage.to) {
                  onRoomClick?.(secretPassage.to);
                }
              }}
            >
              <div className="absolute inset-0.5 rounded-full bg-black opacity-60" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-transparent to-black opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse opacity-80 group-hover:bg-yellow-200" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity" />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto bg-gray-800 p-3 rounded-lg relative"
      style={{
        // Fallback styles when Tailwind is not present
        background: '#1f2937', // gray-800
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div
        className="grid grid-cols-5 gap-2 items-center justify-items-center relative w-full"
        style={{
          // Ensure grid layout without Tailwind
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 5.5rem)',
          gap: '0.5rem',
          placeItems: 'center',
          width: '100%',
        }}
      >
        {gridLayout.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (cell === 'x') {
              return (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className="bg-gray-800"
                  style={{
                    // Match room size
                    height: '5.5rem',
                    width: '5.5rem',
                    background: 'transparent',
                  }}
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