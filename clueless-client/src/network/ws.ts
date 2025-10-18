// Lightweight WebSocket wrapper + dev mock
export type WSMessageType =
  | 'JOIN_GAME'
  | 'LEAVE_GAME'
  | 'LEAVE_LOBBY'
  | 'SELECT_CHARACTER'
  | 'TOGGLE_READY'
  | 'START_GAME'
  | 'GAME_STATE_UPDATE'
  | 'ERROR'
  | 'REQUEST_INITIAL_STATE'
  | 'MOVE_REQUEST'
  | 'MAKE_SUGGESTION'
  | 'MAKE_ACCUSE';

export interface WSMessage {
  type: WSMessageType;
  gameId: string;
  playerId: string;
  payload: Record<string, unknown>;
}

type Listener = (payload: unknown) => void;

// Dev mock implementation that simulates server responses. Replace with real WebSocket in production.
const mockWebSocket = (() => {
  interface MockPlayer { id: string; name: string; characterId?: string | null; characterName?: string; isReady?: boolean }
  interface MockState { id: string; hostId: string; status: string; players: MockPlayer[]; eventFeed?: string[] }

  let state: MockState | null = null;
  const listeners: Record<string, Listener[]> = {};

  const emit = (type: WSMessageType, payload: unknown | null) => {
    const callbacks = listeners[type];
    const data = payload ? JSON.parse(JSON.stringify(payload)) : null;
    if (callbacks) callbacks.forEach(cb => cb(data ?? {}));
  };

  const initLobby = (playerId: string) => {
    state = {
      id: 'CLUE-2024', // Add missing id field
      hostId: playerId,
      status: 'waiting',
      players: [
        { id: playerId, name: 'New Player', characterId: null, characterName: '', isReady: false }
      ]
    };
  };

  return {
    on(type: WSMessageType, cb: Listener) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(cb);
    },

    off(type: WSMessageType, cb: Listener) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(f => f !== cb);
    },

    send(msg: WSMessage) {
      console.log('[mock ws] send', msg);
      // normalize types for backward compatibility with existing code
      switch (msg.type) {
        case 'JOIN_GAME':
        case 'REQUEST_INITIAL_STATE':
          if (!state) initLobby(msg.playerId);
          
          // Emit immediately for JOIN_GAME to prevent stuck loading screen
          emit('GAME_STATE_UPDATE', state);
          
          // simulate other players joining after a delay
          setTimeout(() => {
            if (!state) return;
            const players = state.players;
            if (players.length < 2) {
              players.push({ id: 'player-2', name: 'Player 2', characterId: null, characterName: '', isReady: false });
              emit('GAME_STATE_UPDATE', state);
            }
          }, 500);
          break;
        case 'SELECT_CHARACTER':
          if (!state) return;
          {
            const players = state.players;
            const idx = players.findIndex(p => p.id === msg.playerId);
            if (idx >= 0) {
              const characterId = msg.payload.characterId as string | null;
              players[idx].characterId = characterId ?? null;
              players[idx].characterName = characterId ?? '';
              players[idx].isReady = false;
            }
            emit('GAME_STATE_UPDATE', state);
          }
          break;
        case 'TOGGLE_READY':
          if (!state) return;
          {
            const players = state.players;
            const idx = players.findIndex(p => p.id === msg.playerId);
            if (idx >= 0 && players[idx].characterId) players[idx].isReady = !players[idx].isReady;
            emit('GAME_STATE_UPDATE', state);
          }
          break;
        case 'LEAVE_GAME':
          if (!state) return;
          {
            const players = state.players;
            state.players = players.filter(p => p.id !== msg.playerId);
            if (state.players.length === 0) state = null;
            emit('GAME_STATE_UPDATE', state);
          }
          break;
        // handle simple game actions for GameBoardPage
        case 'MOVE_REQUEST': {
          if (!state) return;
          const feed = state.eventFeed || [];
          feed.unshift(`${msg.playerId} -> MOVE_REQUEST`);
          state.eventFeed = feed.slice(0, 20);
            emit('GAME_STATE_UPDATE', state);
          break;
        }
        case 'MAKE_SUGGESTION': {
          if (!state) return;
          const feed = state.eventFeed || [];
          feed.unshift(`${msg.playerId} -> MAKE_SUGGESTION`);
          state.eventFeed = feed.slice(0, 20);
          emit('GAME_STATE_UPDATE', state);
          break;
        }
        default:
          console.warn('[mock ws] unsupported msg', msg.type);
      }
    }
  };
})();

export default mockWebSocket;
