import React from 'react';

interface PlayerTokenProps {
  characterId: string;
  className?: string;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({ characterId, className = '' }) => {
    const colorMap: Record<string, string> = {
        SCARLET: 'bg-red-500',
        MUSTARD: 'bg-yellow-500',
        WHITE: 'bg-white text-black',
        GREEN: 'bg-green-500',
        PEACOCK: 'bg-blue-400',
        PLUM: 'bg-purple-500'
    };
    return (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${colorMap[characterId]} ${className}`}>
            {characterId.charAt(0)}
        </div>
    );
};

export default PlayerToken;
