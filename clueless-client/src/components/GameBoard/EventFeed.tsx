interface EventFeedProps {
  events: string[];
}

export default function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex-1 overflow-auto">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        Event Feed
      </h3>
      
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">No events yet...</p>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
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
