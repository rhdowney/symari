# WebSocket Integration Guide

## Overview

The app is now fully pre-wired with a WebSocket context system. All components get their WebSocket logic from a central `WebSocketContext` that can seamlessly switch between mock and real WebSocket implementations.

## Current Setup

- ✅ All components (`GameLobby`, `HostLobby`, `GameBoardPage`) use `useWebSocket()` hook
- ✅ WebSocket logic centralized in `WebSocketContext`
- ✅ Real WebSocket adapter created matching mock interface
- ✅ Environment-based configuration ready
- ✅ React Fast Refresh compatible (hook and component separated)
- ✅ Clean barrel exports for easy imports

## Quick Start

### For Development (Mock WebSocket)
```bash
# Use mock WebSocket (default)
npm run dev
```

### For Real Server Integration
```bash
# Create .env file
cp .env.example .env

# Edit .env file:
VITE_USE_REAL_WEBSOCKET=true
VITE_WEBSOCKET_URL=ws://your-server:port/ws

# Start app
npm run dev
```

## Architecture

### File Structure
```
src/context/
├── index.ts              # Barrel exports for clean imports
├── WebSocketContext.tsx  # Provider component only
└── useWebSocket.ts       # Custom hook only
```

### WebSocket Interface
Both mock and real WebSocket implement the same interface:
```typescript
interface WebSocketApi {
  on: (type: WSMessageType, cb: (payload: unknown) => void) => void;
  off: (type: WSMessageType, cb: (payload: unknown) => void) => void;
  send: (msg: WSMessage) => void;
}
```

### Usage in Components
```typescript
// Clean import from barrel export
import { useWebSocket } from '../context';

const MyComponent = () => {
  const ws = useWebSocket();
  // Use ws.on(), ws.off(), ws.send()
};
```

### Message Format
```typescript
interface WSMessage {
  type: WSMessageType;
  gameId: string;
  playerId: string;
  payload: Record<string, unknown>;
}
```

### Message Types
- `JOIN_GAME` - Player joins a game
- `LEAVE_GAME` - Player leaves a game
- `SELECT_CHARACTER` - Player selects character
- `TOGGLE_READY` - Player toggles ready state
- `START_GAME` - Host starts the game
- `GAME_STATE_UPDATE` - Server sends game state updates
- `MOVE_REQUEST` - Player requests to move
- `MAKE_SUGGESTION` - Player makes suggestion
- `MAKE_ACCUSE` - Player makes accusation
- `ERROR` - Error messages

## Files Changed

### Core WebSocket Files
- `src/context/WebSocketContext.tsx` - WebSocket Provider component
- `src/context/useWebSocket.ts` - Custom WebSocket hook
- `src/context/index.ts` - Barrel exports for clean imports
- `src/network/realWebSocket.ts` - Real WebSocket adapter
- `src/network/ws.ts` - Mock WebSocket (existing)

### Updated Components
- `src/pages/GameLobby.tsx` - Now uses `useWebSocket()` hook
- `src/pages/HostLobby.tsx` - Now uses `useWebSocket()` hook  
- `src/pages/GameBoardPage.tsx` - Now uses `useWebSocket()` hook
- `src/main.tsx` - Wraps app with `WebSocketProvider`

### Configuration
- `.env.example` - Environment variable template

## Integration Steps for Backend Developer

1. **Set up your WebSocket server** to accept connections at your chosen URL
2. **Implement message handling** for the message types listed above
3. **Update environment variables** in `.env` file:
   ```
   VITE_USE_REAL_WEBSOCKET=true
   VITE_WEBSOCKET_URL=ws://localhost:8080/ws
   ```
4. **Test the integration** - the app should connect automatically

## WebSocket Server Requirements

Your WebSocket server should:

1. **Accept JSON messages** in the `WSMessage` format
2. **Send responses** as JSON with `type` and `payload` fields
3. **Handle connection events** (connect, disconnect, error)
4. **Broadcast game state updates** to all connected players in a game
5. **Implement reconnection logic** (optional, client has basic retry logic)

## Example Server Message Handling

```javascript
// When client sends:
{
  type: 'JOIN_GAME',
  gameId: 'CLUE-2024',
  playerId: 'user-123',
  payload: {}
}

// Server should respond with:
{
  type: 'GAME_STATE_UPDATE',
  payload: {
    id: 'CLUE-2024',
    hostId: 'host-456',
    status: 'waiting',
    players: [/* player array */]
  }
}
```

## Testing

The app works exactly the same with either WebSocket implementation. All game flows are preserved:
- Host lobby → character selection → game start → game board
- Player lobby → character selection → game start → game board

## Code Quality Features

- ✅ **React Fast Refresh Compatible** - Separated components and hooks into different files
- ✅ **Clean Imports** - Barrel exports allow `import { useWebSocket } from '../context'`
- ✅ **TypeScript Strict Mode** - Full type safety with no compilation warnings
- ✅ **Separation of Concerns** - Provider, hook, and types properly organized

## No Code Changes Needed

Once your WebSocket server is ready, simply:
1. Update the `.env` file with your server URL
2. Set `VITE_USE_REAL_WEBSOCKET=true`
3. The app automatically uses your real WebSocket server!

The components are completely "dumb" - they don't know or care whether they're talking to the mock or real WebSocket.