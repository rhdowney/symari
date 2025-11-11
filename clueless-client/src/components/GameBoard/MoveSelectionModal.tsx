interface MoveSelectionModalProps {
  isOpen: boolean;
  validMoves: string[];
  onSelectMove: (locationId: string) => void;
  onClose: () => void;
}

export default function MoveSelectionModal({
  isOpen,
  validMoves,
  onSelectMove,
  onClose
}: MoveSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">Select Your Move</h2>
        
        {validMoves.length === 0 ? (
          <p className="text-gray-400 mb-4">No valid moves available</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {validMoves.map((move) => (
              <button
                key={move}
                onClick={() => onSelectMove(move)}
                className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
              >
                {move.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
