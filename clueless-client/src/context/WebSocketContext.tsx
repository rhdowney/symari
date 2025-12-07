import React, { createContext, useEffect, useState, useCallback, useRef, useReducer } from 'react';
import { ClueClient } from '../api/ClueClient';
import type { ServerMsg, ClientMsg } from '../api/types';

interface WebSocketContextValue {
  connected: boolean;
  send: (msg: ClientMsg) => void;
  lastMessage?: ServerMsg & { _timestamp?: number };
  error?: string;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

type MessageAction = { type: 'ADD_MESSAGE'; message: ServerMsg & { _timestamp: number } };

function messageReducer(state: (ServerMsg & { _timestamp: number }) | undefined, action: MessageAction) {
  return action.message;
}

export function WebSocketProvider({ children, url }: WebSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, dispatchMessage] = useReducer(messageReducer, undefined);
  const [error, setError] = useState<string>();
  const clientRef = useRef<ClueClient | null>(null);
  const messageCounterRef = useRef(0);
  const messageQueueRef = useRef<(ServerMsg & { _timestamp: number })[]>([]);
  const processingRef = useRef(false);

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
          // Use incrementing counter to ensure each message is unique
          messageCounterRef.current += 1;
          const timestamp = messageCounterRef.current;
          const messageWithTimestamp = { ...msg, _timestamp: timestamp };
          
          // Add to queue
          messageQueueRef.current.push(messageWithTimestamp);
          
          // Process queue if not already processing
          if (!processingRef.current) {
            processingRef.current = true;
            processMessageQueue();
          }
        });
        
        function processMessageQueue() {
          if (messageQueueRef.current.length === 0) {
            processingRef.current = false;
            return;
          }
          
          const nextMessage = messageQueueRef.current.shift()!;
          dispatchMessage({ type: 'ADD_MESSAGE', message: nextMessage });
          
          // Process next message after a short delay
          setTimeout(processMessageQueue, 10);
        }
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
      setError('WebSocket not initialized');
      return;
    }
    try {
      console.log('[WebSocket] Sending:', msg);
      clientRef.current.send(msg);
      // Clear any previous errors on successful send
      setError(undefined);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Send failed';
      console.error('[WebSocket] Send failed:', errMsg);
      // Don't set error for queued messages
      if (!errMsg.includes('queueing')) {
        setError(errMsg);
      }
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
