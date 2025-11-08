// Card type matches server's Card structure
interface Card {
  id?: string;
  name: string;
  type: 'WEAPON' | 'ROOM' | 'SUSPECT' | 'CHARACTER'; // SERVER sends CHARACTER, client expects SUSPECT
}

interface HandPanelProps {
  cards: Card[];
}

export default function HandPanel({ cards }: HandPanelProps) {
  // Character emoji mapping (matching Board.tsx)
  const getCharacterEmoji = (characterName: string): string => {
    const upperName = characterName.toUpperCase();
    switch (upperName) {
      case 'SCARLET':
      case 'MISS SCARLET':
        return '🔴';
      case 'MUSTARD':
      case 'COLONEL MUSTARD':
        return '🟡';
      case 'WHITE':
      case 'MRS. WHITE':
      case 'MRS WHITE':
        return '⚪';
      case 'GREEN':
      case 'MR. GREEN':
      case 'MR GREEN':
        return '🟢';
      case 'PEACOCK':
      case 'MRS. PEACOCK':
      case 'MRS PEACOCK':
        return '🔵';
      case 'PLUM':
      case 'PROFESSOR PLUM':
        return '🟣';
      default:
        return '🕵️';
    }
  };

  // Room emoji mapping (matching Board.tsx)
  const getRoomEmoji = (roomName: string): string => {
    const upperRoom = roomName.toUpperCase();
    switch (upperRoom) {
      case 'STUDY':
        return '📚';
      case 'HALL':
        return '🏛️';
      case 'LOUNGE':
        return '🛋️';
      case 'LIBRARY':
        return '📖';
      case 'BILLIARD':
      case 'BILLIARD ROOM':
        return '🎱';
      case 'DINING':
      case 'DINING ROOM':
        return '🍽️';
      case 'CONSERVATORY':
        return '🌿';
      case 'BALLROOM':
        return '💃';
      case 'KITCHEN':
        return '👨‍🍳';
      default:
        return '🏠';
    }
  };

  // Weapon emoji mapping
  const getWeaponEmoji = (weaponName: string): string => {
    const upperWeapon = weaponName.toUpperCase();
    switch (upperWeapon) {
      case 'CANDLESTICK':
        return '🕯️';
      case 'KNIFE':
      case 'DAGGER':
        return '🔪';
      case 'LEAD PIPE':
      case 'PIPE':
        return '🔧';
      case 'REVOLVER':
      case 'GUN':
        return '🔫';
      case 'ROPE':
        return '🪢';
      case 'WRENCH':
        return '🔧';
      default:
        return '⚔️';
    }
  };

  const getCardEmoji = (card: Card): string => {
    switch (card.type) {
      case 'WEAPON':
        return getWeaponEmoji(card.name);
      case 'ROOM':
        return getRoomEmoji(card.name);
      case 'SUSPECT':
      case 'CHARACTER': // Server sends CHARACTER type
        return getCharacterEmoji(card.name);
      default:
        return '🃏';
    }
  };

  const getCardColors = (type: Card['type']) => {
    switch (type) {
      case 'WEAPON':
        return {
          background: 'linear-gradient(to bottom right, #7f1d1d, #450a0a)',
          borderColor: '#dc2626'
        };
      case 'ROOM':
        return {
          background: 'linear-gradient(to bottom right, #1e3a8a, #172554)',
          borderColor: '#2563eb'
        };
      case 'SUSPECT':
      case 'CHARACTER': // Server sends CHARACTER type
        return {
          background: 'linear-gradient(to bottom right, #581c87, #3b0764)',
          borderColor: '#9333ea'
        };
      default:
        return {
          background: 'linear-gradient(to bottom right, #1f2937, #111827)',
          borderColor: '#4b5563'
        };
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cards.map((card, index) => {
            const colors = getCardColors(card.type);
            // Format card type to sentence case
            const typeDisplay = card.type === 'CHARACTER' ? 'Suspect' : 
                               card.type === 'SUSPECT' ? 'Suspect' :
                               card.type.charAt(0) + card.type.slice(1).toLowerCase();
            
            // Format card name to title case
            const formatCardName = (name: string) => {
              return name.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
            };
            
            return (
              <div
                key={card.id || index}
                className="p-4 rounded-xl border-2 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 flex items-center justify-center"
                style={{
                  background: colors.background,
                  borderColor: colors.borderColor,
                  minHeight: '40px'
                }}
              >
              {/* Card type, emoji and name in one line */}
              <div className="flex items-center text-white text-sm">
                <span className="font-semibold">{typeDisplay}:</span>
                <span className="text-2xl mx-2">{getCardEmoji(card)}</span>
                <span className="font-bold">{formatCardName(card.name)}</span>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
