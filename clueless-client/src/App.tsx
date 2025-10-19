import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { ClueClient } from './api/ClueClient';
import type { ClientMsg, ServerMsg, GameSnapshot } from './api/types';
import Board from './components/Board';

export default function App() {
  const client = useMemo(() => new ClueClient(), []);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<GameSnapshot | undefined>(undefined);
  const [log, setLog] = useState<string[]>([]);

  const [gameId, setGameId] = useState('g1');
  const [playerId, setPlayerId] = useState('p1');

  useEffect(() => {
    client.connect()
      .then(() => {
        setConnected(true);
        client.onMessage((m: ServerMsg) => {
          setLog(l => [JSON.stringify(m), ...l]);
          if ((m as any).state) setSnapshot((m as any).state as GameSnapshot);
        });
      })
      .catch((e) => setLog(l => [`Connect error: ${e}`, ...l]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (msg: ClientMsg) => {
    try { client.send(msg); } catch (e: any) { setLog(l => [`Send error: ${e.message}`, ...l]); }
  };

  const me = snapshot?.players.find(p => p.name === playerId);
  const turn = snapshot?.currentPlayer;

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <h2>Clueless {connected ? '✅' : '❌'}</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>Game</label>
        <input value={gameId} onChange={e => setGameId(e.target.value)} style={{ width: 100 }} />
        <label>Player</label>
        <input value={playerId} onChange={e => setPlayerId(e.target.value)} style={{ width: 120 }} />
        <button onClick={() => send({ type: 'JOIN', gameId, playerId })}>JOIN</button>
        <button onClick={() => send({ type: 'PING' })}>PING</button>
        <button onClick={() => send({ type: 'NEW_GAME', gameId, playerId, payload: { keepPlayers: true } })}>
          NEW GAME (keep players)
        </button>
        <span>Turn: {snapshot?.currentPlayer ?? '-'}</span>
        <span>Game Over: {String(snapshot?.gameOver ?? false)} {snapshot?.winner ? `(Winner: ${snapshot.winner})` : ''}</span>
      </div>

      <Board
        snapshot={snapshot}
        onRoomClick={(room) => send({ type: 'MOVE', gameId, playerId, payload: { to: room } })}
      />

      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <h4>Actions</h4>
          <div style={{ display: 'grid', gap: 6 }}>
            <button onClick={() => send({ type: 'SUGGEST', gameId, playerId, payload: { suspect: 'GREEN', weapon: 'ROPE', room: me?.room ?? 'HALL' } })}>
              SUGGEST (room={me?.room ?? 'HALL'})
            </button>
            <button onClick={() => send({ type: 'ACCUSE', gameId, playerId, payload: { suspect: 'GREEN', weapon: 'ROPE', room: 'HALL' } })}>ACCUSE</button>
            <button onClick={() => send({ type: 'END_TURN', gameId, playerId })}>END TURN</button>
          </div>
        </div>

        <div>
          <h4>Players</h4>
          <ul>
            {(snapshot?.players ?? []).map(p =>
              <li key={p.name}>
                {p.name} {p.active ? '' : '(out)'} {p.room ? `- ${p.room}` : ''} {p.name === turn ? '⬅ turn' : ''}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div>
        <h4>Log</h4>
        <pre style={{ maxHeight: 260, overflow: 'auto', background: '#111', color: '#0f0', padding: 8 }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </pre>
      </div>
    </div>
  );
}
