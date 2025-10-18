import React from 'react';
import { Check, X, HelpCircle } from '../icons';
import type { LobbyPlayer } from './LobbyTypes';
import { ALL_CHARACTERS } from './LobbyTypes';

interface PlayerListItemProps {
  player: LobbyPlayer | null;
  isCurrentUser?: boolean;
  isHost?: boolean;
  overrideCharacterId?: string | null;
  overrideIsReady?: boolean;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  isCurrentUser,
  isHost,
  overrideCharacterId,
  overrideIsReady,
}) => {
  if (!player) {
    return (
      <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-700/50 rounded-full mr-4">
          <HelpCircle className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-400">Waiting for player...</p>
      </div>
    );
  }

  // Use override values if provided, otherwise use player values
  const effectiveCharacterId = overrideCharacterId !== undefined ? overrideCharacterId : player.characterId;
  const effectiveIsReady = overrideIsReady !== undefined ? overrideIsReady : player.isReady;

  // Find character name from ALL_CHARACTERS if we have a characterId
  const character = effectiveCharacterId
    ? ALL_CHARACTERS.find((c) => c.id === effectiveCharacterId)
    : null;
  const displayName = isCurrentUser ? 'You' : player.name;
  const hostLabel = isHost ? ' (Host)' : '';
  const displayCharacter = character ? character.name : 'Picking character...';

  return (
    <div className="flex items-center p-3 bg-gray-800 rounded-lg">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 font-bold text-white ${
          effectiveCharacterId ? 'bg-indigo-600' : 'bg-gray-600'
        }`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-grow">
        <p className="font-bold text-white">
          {displayName}
          {hostLabel}
        </p>
        <p className="text-sm text-gray-400">{displayCharacter}</p>
      </div>
      {effectiveIsReady ? (
        <span className="flex items-center text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          <Check className="w-3 h-3 mr-1" />
          Ready
        </span>
      ) : (
        <span className="flex items-center text-xs font-semibold bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full">
          <X className="w-3 h-3 mr-1" />
          Not Ready
        </span>
      )}
    </div>
  );
};

export default PlayerListItem;
