interface ActionBarProps {
  isMyTurn: boolean;
  onMove: () => void;
  onSuggest: () => void;
  onAccuse: () => void;
  onEndTurn: () => void;
  canMove: boolean;
  canSuggest: boolean;
  canAccuse: boolean;
}

export default function ActionBar({
  isMyTurn,
  onMove,
  onSuggest,
  onAccuse,
  onEndTurn,
  canMove,
  canSuggest,
  canAccuse
}: ActionBarProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isMyTurn ? (
            <div className="text-green-400 font-semibold flex items-center gap-2">
              <span className="animate-pulse">🎯</span>
              <span>Your Turn</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Waiting for other players...
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onMove}
            disabled={!isMyTurn || !canMove}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isMyTurn && canMove
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Move
          </button>
          
          <button
            onClick={onSuggest}
            disabled={!isMyTurn || !canSuggest}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isMyTurn && canSuggest
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Suggest
          </button>
          
          <button
            onClick={onAccuse}
            disabled={!isMyTurn || !canAccuse}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isMyTurn && canAccuse
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Accuse
          </button>
          
          <button
            onClick={onEndTurn}
            disabled={!isMyTurn}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isMyTurn
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            End Turn
          </button>
        </div>
      </div>
    </div>
  );
}
