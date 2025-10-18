import React from 'react';
import type { Character, CharacterWithStatus } from './LobbyTypes';

interface CharacterCardProps {
  character?: CharacterWithStatus;
  isSelected: boolean;
  onSelect: (character: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, onSelect }) => {
  // Add a guard clause to prevent rendering if the character prop is not provided.
  if (!character) {
    return null;
  }

  const isTaken = character.isTaken;

  // Character-specific circle colors
  const getCharacterColor = (id: string) => {
    switch (id) {
      case 'SCARLET':
        return 'bg-red-600';
      case 'WHITE':
        return 'bg-gray-100';
      case 'PEACOCK':
        return 'bg-blue-600';
      case 'MUSTARD':
        return 'bg-yellow-500';
      case 'GREEN':
        return 'bg-green-600';
      case 'PLUM':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const cardClasses = `p-4 rounded-lg flex items-center justify-between transition-all duration-200 ${
    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''
  } ${
    isTaken && !isSelected
      ? 'bg-gray-700 text-gray-400 opacity-60 cursor-not-allowed'
      : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
  }`;

  const circleClasses = `w-12 h-12 rounded-full ${getCharacterColor(character.id)} ${
    isTaken && !isSelected ? 'opacity-50' : ''
  } transition-all duration-200`;

  return (
    <div className={cardClasses} onClick={() => !isTaken && onSelect(character)}>
      <div>
        <p className="text-lg font-bold text-white">{character.name}</p>
        <p className="text-sm text-gray-300">{isTaken && !isSelected ? 'Taken' : 'Select'}</p>
      </div>
      <div className={circleClasses}></div>
    </div>
  );
};

export default CharacterCard;



