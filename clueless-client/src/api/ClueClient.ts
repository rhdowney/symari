import type { ClientMsg, ServerMsg } from './types';

export class ClueClient {
  private ws?: WebSocket;
  constructor(private url = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8081') {}
  connect(): Promise<void> {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => res();
      this.ws.onerror = (e) => rej(e);
    });
  }
  onMessage(handler: (msg: ServerMsg) => void) {
    if (!this.ws) throw new Error('Not connected');
    this.ws.onmessage = (ev) => {
      try { handler(JSON.parse(String(ev.data))); } catch { /* ignore */ }
    };
  }
  send(msg: ClientMsg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('Socket not connected');
    this.ws.send(JSON.stringify(msg));
  }
}