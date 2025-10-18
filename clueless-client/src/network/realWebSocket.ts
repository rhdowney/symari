import type { WSMessage, WSMessageType } from './ws';

type Listener = (payload: unknown) => void;

/**
 * Real WebSocket adapter that matches the mock's interface
 * This creates a WebSocket connection and provides the same on/off/send API
 */
export const createRealWebSocket = (url: string) => {
  const listeners: Record<string, Listener[]> = {};
  let ws: WebSocket | null = null;
  let isConnected = false;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  const emit = (type: WSMessageType, payload: unknown) => {
    const callbacks = listeners[type];
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload);
        } catch (error) {
          console.error('[RealWebSocket] Error in listener callback:', error);
        }
      });
    }
  };

  const connect = () => {
    try {
      console.log('[RealWebSocket] Connecting to:', url);
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[RealWebSocket] Connected');
        isConnected = true;
        reconnectAttempts = 0;
        // You might want to emit a connection event here
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[RealWebSocket] Received:', message);
          
          // Emit the message type with the payload
          if (message.type) {
            emit(message.type as WSMessageType, message.payload || message);
          }
        } catch (error) {
          console.error('[RealWebSocket] Error parsing message:', error);
          emit('ERROR', { error: 'Failed to parse message' });
        }
      };

      ws.onclose = (event) => {
        console.log('[RealWebSocket] Disconnected:', event.code, event.reason);
        isConnected = false;
        ws = null;

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          console.log(`[RealWebSocket] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts + 1})`);
          setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, reconnectDelay);
        } else {
          emit('ERROR', { error: 'WebSocket connection closed' });
        }
      };

      ws.onerror = (error) => {
        console.error('[RealWebSocket] Error:', error);
        emit('ERROR', { error: 'WebSocket connection error' });
      };

    } catch (error) {
      console.error('[RealWebSocket] Failed to create WebSocket:', error);
      emit('ERROR', { error: 'Failed to create WebSocket connection' });
    }
  };

  // Initialize connection
  connect();

  // Return the API that matches your mock
  return {
    on(type: WSMessageType, cb: Listener) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(cb);
    },

    off(type: WSMessageType, cb: Listener) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(f => f !== cb);
    },

    send(msg: WSMessage) {
      if (!ws || !isConnected) {
        console.warn('[RealWebSocket] Cannot send message: not connected');
        // Optionally queue messages for when connection is restored
        return;
      }

      try {
        console.log('[RealWebSocket] Sending:', msg);
        ws.send(JSON.stringify(msg));
      } catch (error) {
        console.error('[RealWebSocket] Error sending message:', error);
        emit('ERROR', { error: 'Failed to send message' });
      }
    },

    // Additional utility methods (optional)
    isConnected: () => isConnected,
    disconnect: () => {
      if (ws) {
        ws.close(1000, 'Manual disconnect');
      }
    }
  };
};

export default createRealWebSocket;