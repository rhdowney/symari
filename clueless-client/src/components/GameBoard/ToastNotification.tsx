import { useEffect, useState } from 'react';
import type { GameSnapshot } from '../../api/types';

interface ToastNotificationProps {
  gameState: GameSnapshot;
  currentPlayerId: string;
}

export default function ToastNotification({ gameState, currentPlayerId }: ToastNotificationProps) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Show notification when it's the player's turn
    if (gameState.currentPlayer === currentPlayerId && !gameState.gameOver) {
      setMessage("It's your turn!");
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
    
    // Show notification on game over
    if (gameState.gameOver) {
      const winMessage = gameState.winner 
        ? `${gameState.winner} wins!` 
        : 'Game Over!';
      setMessage(winMessage);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.gameOver, gameState.winner, currentPlayerId]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`px-6 py-3 rounded-lg shadow-lg ${
        gameState.gameOver 
          ? 'bg-purple-600 text-white' 
          : 'bg-green-600 text-white'
      }`}>
        <p className="font-semibold">{message}</p>
      </div>
    </div>
  );
}
