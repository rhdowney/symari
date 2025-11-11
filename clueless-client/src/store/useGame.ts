import { useReducer } from 'react';
import type { GameSnapshot, ServerMsg } from '../api/types';

type State = {
  connected: boolean;
  last?: ServerMsg;
  game?: GameSnapshot;
  log: string[];
};

type Action =
  | { type: 'connected' }
  | { type: 'message'; msg: ServerMsg };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'connected':
      return { ...state, connected: true, log: ['Connected', ...state.log] };
    case 'message': {
      const msg = action.msg;
      const next: State = { ...state, last: msg, log: [JSON.stringify(msg), ...state.log] };
      if ('state' in msg && msg.state) next.game = msg.state as GameSnapshot;
      return next;
    }
    default:
      return state;
  }
}

export function useGame() {
  return useReducer(reducer, { connected: false, log: [] });
}