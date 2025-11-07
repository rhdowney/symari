interface LobbyProps {
  playerId: string;
  lobbyState: {
    available: string[];
    selections: Record<string, string>;
    ready: Record<string, boolean>;
  };
  myCharacter: string | null;
  onSelectCharacter: (character: string) => void;
  onUnselectCharacter: () => void;
  onSetReady: (ready: boolean) => void;
  onStartGame: () => void;
  isReady: boolean;
}

const CHARACTER_INFO: Record<string, { name: string; emoji: string; bg: string; hover: string; border: string }> = {
  GREEN: { 
    name: "Mr. Green", 
    emoji: "🟢", 
    bg: "bg-green-600", 
    hover: "hover:bg-green-700", 
    border: "border-green-500" 
  },
  MUSTARD: { 
    name: "Colonel Mustard", 
    emoji: "🟡", 
    bg: "bg-yellow-600", 
    hover: "hover:bg-yellow-700", 
    border: "border-yellow-500" 
  },
  PEACOCK: { 
    name: "Mrs. Peacock", 
    emoji: "🔵", 
    bg: "bg-blue-600", 
    hover: "hover:bg-blue-700", 
    border: "border-blue-500" 
  },
  PLUM: { 
    name: "Professor Plum", 
    emoji: "🟣", 
    bg: "bg-purple-600", 
    hover: "hover:bg-purple-700", 
    border: "border-purple-500" 
  },
  SCARLET: { 
    name: "Miss Scarlet", 
    emoji: "🔴", 
    bg: "bg-red-600", 
    hover: "hover:bg-red-700", 
    border: "border-red-500" 
  },
  WHITE: { 
    name: "Mrs. White", 
    emoji: "⚪", 
    bg: "bg-gray-100", 
    hover: "hover:bg-gray-200", 
    border: "border-gray-400" 
  },
};

export function Lobby({
  playerId,
  lobbyState,
  myCharacter,
  onSelectCharacter,
  onUnselectCharacter,
  onSetReady,
  onStartGame,
  isReady,
}: LobbyProps) {
  const allCharacters = ["GREEN", "MUSTARD", "PEACOCK", "PLUM", "SCARLET", "WHITE"];
  const playersList = Object.keys(lobbyState.selections);
  const allPlayersReady = playersList.length > 0 && playersList.every(p => lobbyState.ready[p]);
  const canStartGame = allPlayersReady && playersList.length >= 3;

  const handleLeaveLobby = () => {
    if (window.confirm('Are you sure you want to leave the lobby?')) {
      // This is a placeholder. In a real app with routing, you'd navigate away.
      // For now, we can just reload the page to simulate leaving.
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">🎲 Game Lobby</h1>
          <p className="text-gray-400">Waiting for players to join...</p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Side: Character Selection Panel */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {allCharacters.map((char) => {
                const info = CHARACTER_INFO[char];
                const isAvailable = lobbyState.available.includes(char);
                const selectedBy = Object.entries(lobbyState.selections).find(
                  ([, c]) => c === char
                )?.[0];
                const isMyCharacter = myCharacter === char;
                const isConfirmedByOther = selectedBy && selectedBy !== playerId && lobbyState.ready[selectedBy];

                return (
                  <button
                    key={char}
                    onClick={() => {
                      if (isMyCharacter) {
                        onUnselectCharacter();
                      } else if (isAvailable) {
                        onSelectCharacter(char);
                      }
                    }}
                    disabled={!isAvailable && !isMyCharacter}
                    className={`
                      relative p-6 rounded-xl border-2 font-bold transition-all
                      ${info.bg} ${info.hover} ${info.border}
                      ${isMyCharacter ? "ring-4 ring-blue-400 scale-105 shadow-xl" : ""}
                      ${!isAvailable && !isMyCharacter ? "opacity-40 cursor-not-allowed" : "shadow-lg"}
                      ${char === "WHITE" ? "text-gray-900" : "text-white"}
                    `}
                  >
                    <div className="text-5xl mb-2">{info.emoji}</div>
                    <div className="text-base font-bold">{info.name}</div>
                    
                    {isConfirmedByOther && (
                      <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                        Taken
                      </div>
                    )}
                    
                    {isMyCharacter && isReady && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        ✓ Ready
                      </div>
                    )}
                    
                    {isMyCharacter && !isReady && (
                      <div className="mt-2 text-xs opacity-90">
                        Click to change
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Player Panel */}
          <div className="md:col-span-1">
            <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col h-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Players ({playersList.length}/6)
              </h3>
              
              <div className="space-y-3 mb-6 flex-grow">
                {Array.from({ length: 6 }).map((_, index) => {
                  const player = playersList[index];
                  
                  if (!player) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="w-full flex items-center gap-4 bg-gray-700/30 rounded-lg p-3 border border-gray-600/50"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl">
                          👤
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-gray-500 italic text-sm">Waiting for player...</div>
                        </div>
                      </div>
                    );
                  }

                  const character = lobbyState.selections[player];
                  const ready = lobbyState.ready[player];
                  const isMe = player === playerId;
                  const charInfo = character ? CHARACTER_INFO[character] : null;

                  return (
                    <div
                      key={player}
                      className={`
                        w-full flex items-center gap-4 rounded-lg p-3 border-2 transition-all
                        ${isMe 
                          ? "bg-blue-900/40 border-blue-500/70 shadow-lg" 
                          : "bg-gray-700/30 border-gray-600/50"
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xl border-2
                        ${ready ? "bg-green-500/20 border-green-400" : "bg-gray-600/20 border-gray-500"}
                      `}>
                        {charInfo ? charInfo.emoji : "👤"}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {player}
                          </span>
                          {isMe && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {character ? charInfo?.name : "No character selected"}
                        </div>
                      </div>

                      {ready && (
                        <div className="text-green-400 text-lg font-bold">✓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {myCharacter && (
                  <button
                    onClick={() => onSetReady(!isReady)}
                    className={`
                      w-full font-bold py-3 px-4 rounded-lg transition-colors
                      ${isReady
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    `}
                  >
                    {isReady ? "Change Character" : "Confirm Character"}
                  </button>
                )}

                {!myCharacter && (
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 cursor-not-allowed font-bold py-3 px-4 rounded-lg"
                  >
                    Select Character First
                  </button>
                )}

                {canStartGame && (
                  <button
                    onClick={onStartGame}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    🎮 Start Game
                  </button>
                )}

                <button 
                  onClick={handleLeaveLobby}
                  className="w-full bg-red-800/70 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Leave Lobby
                </button>

                <p className="text-xs text-gray-400 text-center pt-2">
                  Select and confirm your character to join the game.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
