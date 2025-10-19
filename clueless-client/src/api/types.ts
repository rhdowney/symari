export interface PlayerView {
  name: string;
  character: string;
  room?: string | null;
  active: boolean;
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

export type ServerMsg =
  | { type: 'PONG'; payload: string }
  | { type: 'ACK'; for: 'JOIN' | 'MOVE' | 'SUGGEST' | 'ACCUSE' | 'END_TURN' | 'NEW_GAME'; state?: GameSnapshot; [k: string]: any }
  | { type: 'EVENT'; event: 'JOIN' | 'MOVE' | 'SUGGEST' | 'ACCUSE' | 'TURN' | 'NEW_GAME'; state: GameSnapshot; [k: string]: any }
  | { type: 'ERROR'; message: string }
  | any;

export interface ClientMsg {
  type: string;
  gameId?: string;
  playerId?: string;
  payload?: any;
}