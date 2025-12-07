interface ActionBarProps {
  isMyTurn: boolean;
  onSuggest: () => void;
  onAccuse: () => void;
  onEndTurn: () => void;
  canSuggest: boolean;
  canAccuse: boolean;
  mustExitRoom?: boolean;
}

export default function ActionBar({
  isMyTurn,
  onSuggest,
  onAccuse,
  onEndTurn,
  canSuggest,
  canAccuse,
  mustExitRoom = false
}: ActionBarProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isMyTurn ? (
            <>
              <div className="text-green-400 font-semibold flex items-center gap-2">
                <span className="animate-pulse">🎯</span>
                <span>Your Turn</span>
              </div>
              {mustExitRoom && (
                <div className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Must exit room before suggesting</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-sm">
              Waiting for other players...
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
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
