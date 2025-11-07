// Card type matches server's Card structure
interface Card {
  id?: string;
  name: string;
  type: 'WEAPON' | 'ROOM' | 'SUSPECT';
}

interface HandPanelProps {
  cards: Card[];
}

export default function HandPanel({ cards }: HandPanelProps) {
  const getCardColor = (type: Card['type']) => {
    switch (type) {
      case 'WEAPON':
        return 'bg-red-900/50 border-red-700';
      case 'ROOM':
        return 'bg-blue-900/50 border-blue-700';
      case 'SUSPECT':
        return 'bg-purple-900/50 border-purple-700';
      default:
        return 'bg-gray-900/50 border-gray-700';
    }
  };

  const getCardIcon = (type: Card['type']) => {
    switch (type) {
      case 'WEAPON':
        return '🔪';
      case 'ROOM':
        return '🏠';
      case 'SUSPECT':
        return '🕵️';
      default:
        return '🃏';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex-1 overflow-auto">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        Your Cards ({cards.length})
      </h3>
      
      {cards.length === 0 ? (
        <p className="text-gray-500 text-sm">No cards yet...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card, index) => (
            <div
              key={card.id || index}
              className={`p-3 rounded-lg border-2 ${getCardColor(card.type)} transition-all hover:scale-105`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCardIcon(card.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{card.name}</p>
                  <p className="text-xs text-gray-400">{card.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
