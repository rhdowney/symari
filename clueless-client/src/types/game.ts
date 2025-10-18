export interface Card {
  id: string;
  name: string;
  type: 'SUSPECT' | 'WEAPON' | 'ROOM';
}

export interface PlayerToken {
  playerId: string;
  characterId: string;
  locationId: string;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  characterId: string | null;
  characterName: string;
  isReady: boolean;
}

export interface GamePlayer extends LobbyPlayer {
  hand: Card[];
}

export interface Suggestion {
  suggesterId: string;
  suggestion: string;
  disproverId: string | null;
  disproved: boolean;
}

export interface GameState {
  id: string;
  hostId: string;
  status: 'in-game' | 'finished';
  players: GamePlayer[];
  playerTokens: PlayerToken[];
  currentTurnPlayerId: string;
  suggestion: Suggestion | null;
  winner: string | null;
  eventFeed: string[];
  // Additional Clue-Less specific state
  lastMovedPlayer?: string; // Track if a player was moved by suggestion
  gamePhase: 'MOVING' | 'SUGGESTING' | 'RESPONDING_TO_SUGGESTION' | 'ACCUSING';
}

export interface CurrentUser {
  id: string;
  name: string;
}