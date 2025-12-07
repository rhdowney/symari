import type { Card } from '../../api/types';

interface DisproveModalProps {
  isOpen: boolean;
  suggester: string;
  suspect: string;
  weapon: string;
  room: string;
  matchingCards: Card[];
  onSelectCard: (cardName: string) => void;
  onClose: () => void;
}

export default function DisproveModal({
  isOpen,
  suggester,
  suspect,
  weapon,
  room,
  matchingCards,
  onSelectCard,
  onClose
}: DisproveModalProps) {
  if (!isOpen) return null;

  const formatName = (name: string) => {
    return name.split('_').map(part => 
      part.charAt(0) + part.slice(1).toLowerCase()
    ).join(' ');
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'WEAPON': return 'border-red-500 bg-red-900 bg-opacity-20';
      case 'ROOM': return 'border-blue-500 bg-blue-900 bg-opacity-20';
      case 'SUSPECT': return 'border-purple-500 bg-purple-900 bg-opacity-20';
      default: return 'border-gray-500 bg-gray-900 bg-opacity-20';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Suggestion to Disprove</h2>
        
        <div className="space-y-4">
          {/* Suggestion Details */}
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <p className="text-gray-300 mb-3">
              <strong className="text-white">{suggester}</strong> suggested:
            </p>
            <div className="space-y-2 text-gray-300">
              <p>🕵️ <strong>Suspect:</strong> {formatName(suspect)}</p>
              <p>🔪 <strong>Weapon:</strong> {formatName(weapon)}</p>
              <p>🏠 <strong>Room:</strong> {formatName(room)}</p>
            </div>
          </div>

          {/* Matching Cards */}
          {matchingCards.length > 0 ? (
            <div>
              <p className="text-sm text-gray-400 mb-3">
                You have {matchingCards.length === 1 ? 'this card' : 'these cards'} that can disprove the suggestion:
              </p>
              <div className="space-y-2">
                {matchingCards.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectCard(card.name);
                      onClose();
                    }}
                    className={`w-full rounded-lg p-3 border-2 ${getCardColor(card.type)} hover:bg-opacity-40 transition-all cursor-pointer text-left`}
                  >
                    <p className="font-semibold text-white">
                      {formatName(card.name)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {card.type === 'WEAPON' && '🔪 Weapon'}
                      {card.type === 'ROOM' && '🏠 Room'}
                      {card.type === 'SUSPECT' && '🕵️ Suspect'}
                    </p>
                  </button>
                ))}
              </div>
              <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3 mt-4">
                <p className="text-blue-200 text-sm">
                  ℹ️ Click a card to reveal it to {suggester}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300 text-center">
                You don't have any cards to disprove this suggestion.
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
