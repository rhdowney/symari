import { useState } from "react";

interface JoinScreenProps {
  onJoin: (playerName: string) => void;
  connecting: boolean;
}

export function JoinScreen({ onJoin, connecting }: JoinScreenProps) {
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoin(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight mb-2">🔍 Clue-Less</h1>
          <p className="text-gray-400">Join the mystery</p>
        </div>

        <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                Enter Your Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g., Detective Miles"
                maxLength={20}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-gray-900/70 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!playerName.trim()}
                className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Lobby
              </button>
            </div>
          </form>
        </div>
        
        {connecting && (
          <p className="text-center text-gray-400 text-sm mt-6 animate-pulse">
            Establishing connection to the server...
          </p>
        )}
      </div>
    </div>
  );
}
