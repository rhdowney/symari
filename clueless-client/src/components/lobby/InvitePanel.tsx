import React from 'react';
import { Copy } from '../icons';

interface InvitePanelProps {
  roomCode: string;
  serverUrl?: string; // Optional server URL override
}

const InvitePanel: React.FC<InvitePanelProps> = ({ roomCode, serverUrl }) => {
  // Use server-generated URL or fallback to default
  const baseUrl = serverUrl || window.location.origin;
  const inviteLink = `${baseUrl}/join/${roomCode}`;

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Invite Players</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300">Invite Link</label>
          <div className="flex items-center mt-1">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="w-full bg-gray-700 text-white rounded-l-md p-2 font-mono"
            />
            <button
              onClick={() => handleCopyToClipboard(inviteLink)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-md"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePanel;
