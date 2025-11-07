import type { ClientMsg, ServerMsg } from './types';

export class ClueClient {
  private ws?: WebSocket;
  private url: string;
  private messageQueue: ClientMsg[] = [];
  
  constructor(url?: string) {
    this.url = url || (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8081';
  }
  
  connect(): Promise<void> {
    return new Promise((res, rej) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('[ClueClient] WebSocket opened');
          // Send any queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) {
              try {
                this.ws!.send(JSON.stringify(msg));
                console.log('[ClueClient] Sent queued message:', msg);
              } catch (err) {
                console.error('[ClueClient] Failed to send queued message:', err);
              }
            }
          }
          res();
        };
        
        this.ws.onerror = (e) => {
          console.error('[ClueClient] WebSocket error:', e);
          // Only reject if we haven't connected yet
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            rej(new Error('Failed to connect to WebSocket server'));
          }
        };
        
        this.ws.onclose = () => {
          console.log('[ClueClient] WebSocket closed');
        };
      } catch (err) {
        rej(err);
      }
    });
  }
  
  onMessage(handler: (msg: ServerMsg) => void) {
    if (!this.ws) throw new Error('Not connected');
    this.ws.onmessage = (ev) => {
      try { 
        const msg = JSON.parse(String(ev.data));
        console.log('[ClueClient] Received message:', msg);
        handler(msg);
      } catch (err) {
        console.error('[ClueClient] Failed to parse message:', err);
      }
    };
  }
  
  send(msg: ClientMsg) {
    if (!this.ws) {
      console.warn('[ClueClient] WebSocket not initialized, queueing message:', msg);
      this.messageQueue.push(msg);
      return;
    }
    
    if (this.ws.readyState === WebSocket.CONNECTING) {
      console.warn('[ClueClient] WebSocket still connecting, queueing message:', msg);
      this.messageQueue.push(msg);
      return;
    }
    
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ClueClient] WebSocket not open (state: ' + this.ws.readyState + '), cannot send:', msg);
      throw new Error('Socket not connected');
    }
    
    this.ws.send(JSON.stringify(msg));
    console.log('[ClueClient] Sent message:', msg);
  }
}