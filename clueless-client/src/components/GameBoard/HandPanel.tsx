import React from 'react';
import type { Card } from '../../types/game';

interface HandPanelProps {
  cards: Card[];
}

const HandPanel: React.FC<HandPanelProps> = ({ cards }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex-1 h-full overflow-y-auto">
    <h3 className="font-bold text-white mb-2">Your Hand (Private)</h3>
    <div className="flex flex-wrap gap-2">
      {cards.map(card => (
        <div key={card.id} className="bg-gray-700 p-2 rounded-md text-white text-sm">
          {card.name}
        </div>
      ))}
    </div>
  </div>
);

export default HandPanel;
