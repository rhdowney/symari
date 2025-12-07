export interface Card {
  id?: string;
  name: string;
  type: 'WEAPON' | 'ROOM' | 'SUSPECT';
}

export interface PlayerView {
  name: string;
  character: string;
  room?: string | null;
  location?: {
    type: 'ROOM' | 'HALLWAY';
    name: string;
  } | null;
  active: boolean;
  hand?: Card[]; // Optional for now, only visible to the player themselves
  roomEntryType?: 'NONE' | 'SELF' | 'SUGGESTION';
  mustExit?: boolean;
}

export interface RoomView {
  name: string;
  occupants: string[]; // player names
}

export interface GameSnapshot {
  players: PlayerView[];
  rooms: RoomView[];
  currentPlayer?: string | null;
  gameOver?: boolean;
  winner?: string | null;
}

export interface LobbySnapshot {
  gameId: string;
  started: boolean;
  players: string[];
  selections: Record<string, string>; // playerId -> character
  available: string[];
  ready: Record<string, boolean>;
}

export type ServerMsg =
  | { type: 'PONG'; payload: string }
  | { type: 'ACK'; for: 'JOIN' | 'JOIN_LOBBY' | 'SELECT_CHARACTER' | 'UNSELECT_CHARACTER' | 'SET_READY' | 'START_GAME' | 'MOVE' | 'MOVE_TO_HALLWAY' | 'MOVE_FROM_HALLWAY' | 'SUGGEST' | 'ACCUSE' | 'END_TURN' | 'NEW_GAME'; state?: GameSnapshot; lobby?: LobbySnapshot; [k: string]: any }
  | { type: 'EVENT'; event: 'JOIN' | 'LOBBY_JOIN' | 'CHARACTER_SELECTED' | 'CHARACTER_UNSELECTED' | 'READY_CHANGED' | 'START_GAME' | 'MOVE' | 'MOVE_TO_HALLWAY' | 'MOVE_FROM_HALLWAY' | 'SUGGEST' | 'ACCUSE' | 'TURN' | 'NEW_GAME' | 'DISPROVE_REVEAL' | 'DISPROVE_DONE'; state?: GameSnapshot; lobby?: LobbySnapshot; [k: string]: any }
  | { type: 'DISPROVE_REQUEST'; gameId: string; disprover: string; suggester: string; suspect: string; weapon: string; room: string; candidateCards: string }
  | { type: 'ERROR'; message: string }
  | any;

export interface ClientMsg {
  type: string;
  gameId?: string;
  playerId?: string;
  payload?: any;
}