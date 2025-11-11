import { useState } from 'react';

interface AccusationModalProps {
  isOpen: boolean;
  activeSuspects: string[]; // Only the characters actually in the game
  onSubmit: (suspect: string, weapon: string, room: string) => void;
  onClose: () => void;
}

const WEAPONS = ['CANDLESTICK', 'DAGGER', 'LEAD_PIPE', 'REVOLVER', 'ROPE', 'WRENCH'];
const ROOMS = ['STUDY', 'HALL', 'LOUNGE', 'LIBRARY', 'BILLIARD', 'DINING', 'CONSERVATORY', 'BALLROOM', 'KITCHEN'];

export default function AccusationModal({
  isOpen,
  activeSuspects,
  onSubmit,
  onClose
}: AccusationModalProps) {
  const [suspect, setSuspect] = useState(activeSuspects[0] || '');
  const [weapon, setWeapon] = useState(WEAPONS[0]);
  const [room, setRoom] = useState(ROOMS[0]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    onSubmit(suspect, weapon, room);
    setShowConfirmation(false);
    onClose();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Make an Accusation</h2>
        
        {!showConfirmation ? (
          <div className="space-y-4">
            {/* Warning Message */}
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">
                ⚠️ <strong>Warning:</strong> A wrong accusation will eliminate you from the game!
              </p>
            </div>

            {/* Suspect Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Suspect
              </label>
              <select
                value={suspect}
                onChange={(e) => setSuspect(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                {activeSuspects.map(s => (
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
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
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

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                {ROOMS.map(r => (
                  <option key={r} value={r}>
                    {r.split('_').map(part => 
                      part.charAt(0) + part.slice(1).toLowerCase()
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Confirmation Screen */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-white text-lg font-semibold mb-3">Confirm Your Accusation:</p>
              <div className="space-y-2 text-gray-300">
                <p><strong>Suspect:</strong> {suspect.charAt(0) + suspect.slice(1).toLowerCase()}</p>
                <p><strong>Weapon:</strong> {weapon.split('_').map(part => part.charAt(0) + part.slice(1).toLowerCase()).join(' ')}</p>
                <p><strong>Room:</strong> {room.split('_').map(part => part.charAt(0) + part.slice(1).toLowerCase()).join(' ')}</p>
              </div>
            </div>

            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm text-center">
                Are you absolutely sure? This cannot be undone!
              </p>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Yes, Accuse!
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
