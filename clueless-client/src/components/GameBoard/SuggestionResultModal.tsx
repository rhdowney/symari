interface SuggestionResultModalProps {
  isOpen: boolean;
  disprover: string | null;
  revealedCard: string | null;
  onClose: () => void;
}

export default function SuggestionResultModal({
  isOpen,
  disprover,
  revealedCard,
  onClose
}: SuggestionResultModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Suggestion Result</h2>
        
        <div className="space-y-4">
          {disprover && revealedCard ? (
            <div>
              <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg p-4 mb-4">
                <p className="text-purple-200 text-center mb-3">
                  <strong>{disprover}</strong> showed you:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {revealedCard.split('_').map(part => 
                      part.charAt(0) + part.slice(1).toLowerCase()
                    ).join(' ')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-400 text-center">
                This card disproves your suggestion
              </p>
            </div>
          ) : (
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4">
              <p className="text-green-200 text-center">
                🎉 No one could disprove your suggestion!
              </p>
              <p className="text-sm text-gray-400 text-center mt-2">
                This might be the solution...
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
