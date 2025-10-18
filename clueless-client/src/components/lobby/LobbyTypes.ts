export interface Character {
  id: string;
  name: string;
}

export interface CharacterWithStatus extends Character {
  isTaken: boolean;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  characterId: string | null;
  characterName: string;
  isReady: boolean;
}

export interface GameState {
  id: string;
  hostId: string;
  status: 'waiting' | 'in-game' | 'finished';
  players: LobbyPlayer[];
}

export const ALL_CHARACTERS: Character[] = [
  { id: 'SCARLET', name: 'Miss Scarlet' },
  { id: 'MUSTARD', name: 'Col. Mustard' },
  { id: 'WHITE', name: 'Mrs. White' },
  { id: 'GREEN', name: 'Mr. Green' },
  { id: 'PEACOCK', name: 'Mrs. Peacock' },
  { id: 'PLUM', name: 'Prof. Plum' },
];

