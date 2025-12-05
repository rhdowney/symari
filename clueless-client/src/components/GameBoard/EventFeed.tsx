interface EventFeedProps {
  events: string[];
}

export default function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <span>📜</span>
        <span>Event Feed</span>
      </h3>
      
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">No events yet...</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {events.slice().reverse().map((event, index) => (
            <div
              key={index}
              className="text-sm text-gray-300 p-2 bg-gray-900/50 rounded border-l-2 border-blue-500"
            >
              {event}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
