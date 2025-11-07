import { useState } from 'react';

interface SuggestionModalProps {
  isOpen: boolean;
  currentRoom: string;
  onSubmit: (suspect: string, weapon: string, room: string) => void;
  onClose: () => void;
}

const SUSPECTS = ['GREEN', 'MUSTARD', 'PEACOCK', 'PLUM', 'SCARLET', 'WHITE'];
const WEAPONS = ['CANDLESTICK', 'DAGGER', 'LEAD_PIPE', 'REVOLVER', 'ROPE', 'WRENCH'];

export default function SuggestionModal({
  isOpen,
  currentRoom,
  onSubmit,
  onClose
}: SuggestionModalProps) {
  const [suspect, setSuspect] = useState(SUSPECTS[0]);
  const [weapon, setWeapon] = useState(WEAPONS[0]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(suspect, weapon, currentRoom);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Make a Suggestion</h2>
        
        <div className="space-y-4">
          {/* Suspect Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Suspect
            </label>
            <select
              value={suspect}
              onChange={(e) => setSuspect(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              {SUSPECTS.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Weapon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weapon
            </label>
            <select
              value={weapon}
              onChange={(e) => setWeapon(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              {WEAPONS.map(w => (
                <option key={w} value={w}>
                  {w.split('_').map(part => 
                    part.charAt(0) + part.slice(1).toLowerCase()
                  ).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Room Display (pre-filled, read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room (Current Location)
            </label>
            <div className="w-full bg-gray-900 text-gray-300 rounded-lg px-4 py-2 border border-gray-600">
              {currentRoom.split('_').map(part => 
                part.charAt(0) + part.slice(1).toLowerCase()
              ).join(' ')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Make Suggestion
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
