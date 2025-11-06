import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { ClueClient } from '../api/ClueClient';
import type { ServerMsg, ClientMsg } from '../api/types';

interface WebSocketContextValue {
  connected: boolean;
  send: (msg: ClientMsg) => void;
  lastMessage?: ServerMsg;
  error?: string;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

export function WebSocketProvider({ children, url }: WebSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMsg>();
  const [error, setError] = useState<string>();
  const clientRef = useRef<ClueClient | null>(null);

  useEffect(() => {
    const client = new ClueClient(url);
    clientRef.current = client;

    client
      .connect()
      .then(() => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        setError(undefined);

        client.onMessage((msg) => {
          console.log('[WebSocket] Received:', msg);
          setLastMessage(msg);
        });
      })
      .catch((err) => {
        console.error('[WebSocket] Connection failed:', err);
        setError(err.message || 'Connection failed');
        setConnected(false);
      });

    return () => {
      // Cleanup if needed (ClueClient doesn't expose close yet)
      setConnected(false);
    };
  }, [url]);

  const send = useCallback((msg: ClientMsg) => {
    if (!clientRef.current) {
      console.error('[WebSocket] Cannot send: client not initialized');
      return;
    }
    try {
      console.log('[WebSocket] Sending:', msg);
      clientRef.current.send(msg);
    } catch (err) {
      console.error('[WebSocket] Send failed:', err);
      setError(err instanceof Error ? err.message : 'Send failed');
    }
  }, []);

  const value: WebSocketContextValue = {
    connected,
    send,
    lastMessage,
    error,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
