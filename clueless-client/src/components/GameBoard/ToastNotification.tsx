import React from 'react';
import type { GameState, CurrentUser } from '../../types/game';

const ToastNotification: React.FC<{ gameState: GameState; currentUser: CurrentUser }> = ({ gameState, currentUser }) => {
    const isMyTurn = gameState.currentTurnPlayerId === currentUser.id;
    const currentPlayerName = gameState.players.find(p => p.id === gameState.currentTurnPlayerId)?.characterName || 'a player';

    const statusText = isMyTurn ? "Your Turn" : `Waiting for ${currentPlayerName}...`;
    const subText = isMyTurn ? "Select an action: Move, Suggest, or Accuse." : "";

    return (
        <div className={`w-full p-2 text-center text-white rounded-t-lg ${isMyTurn ? 'bg-blue-600' : 'bg-gray-700'}`}>  
            <p className="font-bold">{statusText}</p>
            {subText && <p className="text-sm opacity-80">{subText}</p>}
        </div>
    );
};

export default ToastNotification;
