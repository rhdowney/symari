import React from 'react';
import { Copy } from '../icons';

interface InvitePanelProps {
  roomCode: string;
  serverUrl?: string; // Optional server URL override
}

const InvitePanel: React.FC<InvitePanelProps> = ({ roomCode, serverUrl }) => {
  // Use server-generated URL or fallback to default
  const baseUrl = serverUrl || window.location.origin;
  const inviteLink = `${baseUrl}/lobby`; // Direct players to the game lobby

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Invite Players</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300">Room Code</label>
          <div className="flex items-center mt-1">
            <input
              type="text"
              readOnly
              value={roomCode}
              className="w-full bg-gray-700 text-white rounded-l-md p-2 font-mono text-center text-2xl font-bold"
            />
            <button
              onClick={() => handleCopyToClipboard(roomCode)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-md"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300">Player Lobby Link</label>
          <div className="flex items-center mt-1">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="w-full bg-gray-700 text-white rounded-l-md p-2 font-mono"
            />
            <button
              onClick={() => handleCopyToClipboard(inviteLink)}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-r-md"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">Share the lobby link with players to join your game</p>
      </div>
    </div>
  );
};

export default InvitePanel;
