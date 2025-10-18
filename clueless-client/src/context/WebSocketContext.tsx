import React, { createContext, useMemo } from 'react';
import mockWebSocket from '../network/ws'; // <-- Your existing mock
import createRealWebSocket from '../network/realWebSocket'; // <-- Your new real WebSocket
import type { WSMessage, WSMessageType } from '../network/ws';

// 1. Define the "contract" for our WebSocket
// This matches your mock's interface perfectly.
interface WebSocketApi {
  on: (type: WSMessageType, cb: (payload: unknown) => void) => void;
  off: (type: WSMessageType, cb: (payload: unknown) => void) => void;
  send: (msg: WSMessage) => void;
}

// 2. Create the context
const WebSocketContext = createContext<WebSocketApi | null>(null);

// Export the context for the custom hook
export { WebSocketContext };

// 3. Create the Provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // -----------------------------------------------------------------
  // !! THE MOST IMPORTANT PART !!
  //
  // To switch between mock and real WebSocket, just change this configuration:
  // - Set USE_REAL_WEBSOCKET=true and provide WEBSOCKET_URL for real server
  // - Set USE_REAL_WEBSOCKET=false to use the mock
  //
  const USE_REAL_WEBSOCKET = import.meta.env.VITE_USE_REAL_WEBSOCKET === 'true';
  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws';
  //
  // -----------------------------------------------------------------

  const wsApi: WebSocketApi = useMemo(() => {
    if (USE_REAL_WEBSOCKET) {
      console.log('[WebSocketContext] Using real WebSocket:', WEBSOCKET_URL);
      return createRealWebSocket(WEBSOCKET_URL);
    } else {
      console.log('[WebSocketContext] Using mock WebSocket');
      return mockWebSocket;
    }
  }, [USE_REAL_WEBSOCKET, WEBSOCKET_URL]);

  return (
    <WebSocketContext.Provider value={wsApi}>
      {children}
    </WebSocketContext.Provider>
  );
};