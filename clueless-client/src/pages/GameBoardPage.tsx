import { Board } from "../components/Board";
import { useWebSocket } from "../context/useWebSocket";

// Temporary placeholders until we build them later
function TurnIndicator() {
  return <div className="text-sm text-gray-600">Turn: (loading…)</div>;
}

function PlayerList() {
  return <div className="text-sm text-gray-600">Players: (loading…)</div>;
}

function ConnectionStatus({ connected, error }: { connected: boolean; error?: string }) {
  if (error) {
    return (
      <div className="px-3 py-1 rounded-full bg-red-900 text-red-200 text-xs font-medium">
        ❌ Error: {error}
      </div>
    );
  }
  if (connected) {
    return (
      <div className="px-3 py-1 rounded-full bg-green-900 text-green-200 text-xs font-medium">
        ✓ Connected to Server
      </div>
    );
  }
  return (
    <div className="px-3 py-1 rounded-full bg-yellow-900 text-yellow-200 text-xs font-medium animate-pulse">
      ⋯ Connecting to ws://localhost:8081...
    </div>
  );
}

export default function GameBoardPage() {
  const { connected, error } = useWebSocket();

  return (
    <div className="min-h-screen flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clue-Less</h1>
        <div className="flex items-center gap-4">
          <ConnectionStatus connected={connected} error={error} />
          <TurnIndicator />
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
        <div className="flex items-center justify-center">
          <Board />
        </div>
        <aside className="space-y-4">
          <PlayerList />
          {/* Action panels will go here later */}
        </aside>
      </main>
    </div>
  );
}
