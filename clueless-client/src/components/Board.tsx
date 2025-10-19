import React from 'react';
import type { GameSnapshot, RoomView } from '../api/types';

type Props = {
  snapshot?: GameSnapshot;
  onRoomClick?: (room: string) => void;
};

const positions: Record<string, { gridColumn: number; gridRow: number; label: string }> = {
  STUDY: { gridColumn: 1, gridRow: 1, label: 'STUDY' },
  HALL: { gridColumn: 2, gridRow: 1, label: 'HALL' },
  LOUNGE: { gridColumn: 3, gridRow: 1, label: 'LOUNGE' },

  LIBRARY: { gridColumn: 1, gridRow: 2, label: 'LIBRARY' },
  BILLIARD: { gridColumn: 2, gridRow: 2, label: 'BILLIARD' },
  DINING: { gridColumn: 3, gridRow: 2, label: 'DINING' },

  CONSERVATORY: { gridColumn: 1, gridRow: 3, label: 'CONSERVATORY' },
  BALLROOM: { gridColumn: 2, gridRow: 3, label: 'BALLROOM' },
  KITCHEN: { gridColumn: 3, gridRow: 3, label: 'KITCHEN' },
};

function initials(name: string) {
  const m = name.trim().match(/\b([A-Za-z])/g);
  return (m ? m.join('') : name.substring(0, 2)).toUpperCase().slice(0, 2);
}

export const Board: React.FC<Props> = ({ snapshot, onRoomClick }) => {
  const roomsByName: Record<string, RoomView> = Object.create(null);
  (snapshot?.rooms ?? []).forEach(r => { roomsByName[r.name.toUpperCase()] = r; });

  return (
    <div className="board">
      {Object.entries(positions).map(([name, pos]) => {
        const room = roomsByName[name] ?? { name, occupants: [] };
        return (
          <div
            key={name}
            className="tile"
            style={{ gridColumn: pos.gridColumn, gridRow: pos.gridRow }}
            onClick={() => onRoomClick?.(name)}
            role="button"
            title={`Move to ${pos.label}`}
          >
            <div className="tile-name">{pos.label}</div>
            <div className="tile-occupants">
              {room.occupants.map(p => (
                <span className="chip" key={p} title={p}>{initials(p)}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Board;