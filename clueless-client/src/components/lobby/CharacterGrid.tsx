import React from 'react';
import CharacterCard from './CharacterCard';
import type { Character, CharacterWithStatus } from './LobbyTypes';

interface CharacterGridProps {
  characters: CharacterWithStatus[] | undefined;
  selectedCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
}

const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  selectedCharacter,
  onSelectCharacter,
}) => {
  if (!characters) return <div>Loading characters...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Select Your Character</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            isSelected={selectedCharacter?.id === char.id}
            onSelect={onSelectCharacter}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterGrid;



