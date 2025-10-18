import React from 'react';
import { ALL_LOCATIONS } from '../../utils/gameLogic';

interface MoveSelectionModalProps {
  isOpen: boolean;
  validMoves: string[];
  onSelectMove: (locationId: string) => void;
  onClose: () => void;
}

const MoveSelectionModal: React.FC<MoveSelectionModalProps> = ({
  isOpen,
  validMoves,
  onSelectMove,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Select Your Move</h3>
        <div className="space-y-2">
          {validMoves.map(locationId => {
            const location = ALL_LOCATIONS[locationId as keyof typeof ALL_LOCATIONS];
            return (
              <button
                key={locationId}
                onClick={() => onSelectMove(locationId)}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-left transition-colors"
              >
                <div className="font-semibold">{location?.name || locationId}</div>
                <div className="text-sm text-gray-300">
                  {location?.type === 'ROOM' ? 'Room' : 'Hallway'}
                  {'hasSecretPassage' in location && location.hasSecretPassage && ' (Secret Passage)'}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full p-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MoveSelectionModal;