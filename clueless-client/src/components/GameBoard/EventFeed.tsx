import React from 'react';

interface EventFeedProps {
  events: string[];
}

const EventFeed: React.FC<EventFeedProps> = ({ events }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex-1 h-full overflow-y-auto">
    <h3 className="font-bold text-white mb-2">Event Feed (Public)</h3>
    <ul className="text-sm text-gray-300 space-y-1">
      {events.map((event, index) => <li key={index}>{event}</li>)}
    </ul>
  </div>
);

export default EventFeed;
