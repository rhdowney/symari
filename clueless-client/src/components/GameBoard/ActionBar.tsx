import React from 'react';

interface ActionBarProps {
  isMyTurn: boolean;
  onMove: () => void;
  onSuggest: () => void;
  onAccuse: () => void;
  canMove?: boolean;
  canSuggest?: boolean;
  canAccuse?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  isMyTurn, 
  onMove, 
  onSuggest, 
  onAccuse,
  canMove = true,
  canSuggest = true,
  canAccuse = true
}) => {
  const baseClass = "font-bold py-2 px-6 rounded-lg transition-colors";
  const enabledClass = "bg-gray-600 hover:bg-gray-500 text-white";
  const disabledClass = "bg-gray-800 text-gray-500 cursor-not-allowed";

  const getButtonClass = (canPerformAction: boolean) => {
    return `${baseClass} ${(isMyTurn && canPerformAction) ? enabledClass : disabledClass}`;
  };

  return (
    <div className="flex justify-center items-center gap-4 py-3 bg-gray-900">
      <button 
        onClick={onMove} 
        disabled={!isMyTurn || !canMove} 
        className={getButtonClass(canMove)}
        title={!canMove ? "No valid moves available" : ""}
      >
        Move
      </button>
      <button 
        onClick={onSuggest} 
        disabled={!isMyTurn || !canSuggest} 
        className={getButtonClass(canSuggest)}
        title={!canSuggest ? "Must be in a room to make a suggestion" : ""}
      >
        Suggest
      </button>
      <button 
        onClick={onAccuse} 
        disabled={!isMyTurn || !canAccuse} 
        className={getButtonClass(canAccuse)}
        title="Make an accusation to end the game"
      >
        Accuse
      </button>
    </div>
  );
};

export default ActionBar;
