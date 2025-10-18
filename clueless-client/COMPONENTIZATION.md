# Lobby Components - Shared Architecture

## Overview
The lobby components have been consolidated into a single, reusable component library used by both GameLobby and HostLobby pages. This eliminates code duplication and ensures consistent UI/UX across all lobby views.

## Directory Structure

```
src/
├── components/
│   └── lobby/                       # Shared lobby components
│       ├── LobbyTypes.ts            # Shared types and constants
│       ├── CharacterCard.tsx        # Character selection card with colors
│       ├── CharacterGrid.tsx        # Grid of character cards
│       ├── PlayerListItem.tsx       # Player status in sidebar
│       ├── PlayerSidebar.tsx        # Regular player sidebar
│       ├── HostSidebar.tsx          # Host-specific sidebar with controls
│       └── InvitePanel.tsx          # Room code and invite link (host only)
└── pages/
    ├── GameLobby.tsx                # Player lobby page
    └── HostLobby.tsx                # Host lobby page
```

## Shared Components

### 1. **LobbyTypes.ts**
- **Purpose**: Central type definitions and constants for all lobby components
- **Exports**:
  - `Character` - Basic character interface
  - `CharacterWithStatus` - Character with availability status
  - `LobbyPlayer` - Player data structure
  - `GameState` - Complete game state interface (with `id` field)
  - `ALL_CHARACTERS` - Array of all 6 Clue characters

### 2. **CharacterCard.tsx** ✨
- **Purpose**: Display a single character option
- **Features**:
  - Character-specific color circles (red, yellow, blue, green, purple, gray)
  - Visual feedback for selected/taken states
  - Click handler for character selection
  - Disabled state for taken characters
  - Smooth transitions and hover effects

### 3. **CharacterGrid.tsx**
- **Purpose**: Layout and manage all character cards
- **Features**:
  - Responsive 2-column grid
  - Loading state handling
  - Passes selection state to cards
- **Used by**: Both GameLobby and HostLobby

### 4. **PlayerListItem.tsx** ✨
- **Purpose**: Display individual player status in sidebar
- **Features**:
  - Shows player name with conditional labels ("You", "(Host)")
  - Displays selected character name from ALL_CHARACTERS
  - Ready/Not Ready badge with icons
  - Empty slot placeholder
  - **Override props** for immediate UI feedback before server confirmation
- **Used by**: PlayerSidebar and HostSidebar

### 5. **PlayerSidebar.tsx**
- **Purpose**: Regular player's sidebar view
- **Features**:
  - Room code display
  - Player list (6 slots)
  - Ready Up button
  - Leave button
- **Used by**: GameLobby.tsx

### 6. **HostSidebar.tsx**
- **Purpose**: Host-specific sidebar with game controls
- **Features**:
  - Player count statistics (Joined/Ready)
  - List of all 6 player slots
  - Start Game button (with validation)
  - Leave button
  - Pending action states
- **Used by**: HostLobby.tsx

### 7. **InvitePanel.tsx**
- **Purpose**: Display and copy room code/link (host-only feature)
- **Features**:
  - Room code display with copy button
  - Invite link display with copy button
  - Clipboard API integration
- **Used by**: HostLobby.tsx

## Benefits of Consolidation

### ✅ **No Code Duplication**
- Single source of truth for all lobby components
- Changes propagate to both GameLobby and HostLobby automatically
- Consistent character colors, styling, and behavior

### ✅ **Maintainability**
- Fix bugs once, benefit everywhere
- Easy to locate component code
- Clear separation between shared and page-specific logic

### ✅ **Type Safety**
- Centralized types prevent inconsistencies
- GameState now includes required `id` field
- ALL_CHARACTERS constant prevents typos

### ✅ **Reusability**
- Components designed to work in multiple contexts
- Optional props for customization (e.g., override props in PlayerListItem)
- Clean interfaces make integration easy

### ✅ **Scalability**
- Easy to add new lobby variants (e.g., spectator view)
- Can extract more shared logic as needed
- Team can work on different pages without conflicts

## Import Patterns

### GameLobby.tsx imports:
```typescript
import CharacterGrid from '../components/lobby/CharacterGrid';
import PlayerSidebar from '../components/lobby/PlayerSidebar';
import {
  ALL_CHARACTERS,
  type Character,
  type GameState,
} from '../components/lobby/LobbyTypes';
```

### HostLobby.tsx imports:
```typescript
import CharacterGrid from '../components/lobby/CharacterGrid';
import InvitePanel from '../components/lobby/InvitePanel';
import HostSidebar from '../components/lobby/HostSidebar';
import {
  ALL_CHARACTERS,
  type Character,
  type CharacterWithStatus,
  type GameState,
} from '../components/lobby/LobbyTypes';
```

## Component Usage Matrix

| Component          | GameLobby | HostLobby | Notes                          |
|--------------------|-----------|-----------|--------------------------------|
| CharacterCard      | ✅        | ✅        | Via CharacterGrid              |
| CharacterGrid      | ✅        | ✅        | Character selection UI         |
| PlayerListItem     | ✅        | ✅        | Via sidebars                   |
| PlayerSidebar      | ✅        | ❌        | Regular player view            |
| HostSidebar        | ❌        | ✅        | Host-specific controls         |
| InvitePanel        | ❌        | ✅        | Host-only feature              |

## Key Improvements from Consolidation

### Before:
- **346 lines** in HostLobby.tsx with inline components
- Separate `host-lobby/` directory with duplicate code
- Character colors only in host-lobby components
- Inconsistent PlayerListItem implementations

### After:
- **159 lines** in HostLobby.tsx (54% reduction)
- Single `lobby/` directory with 7 shared components
- Consistent character colors everywhere
- Unified PlayerListItem with override capabilities
- **41 modules** in build (1 less than duplicate structure)

## State Management Pattern

Both pages follow the same pattern:
- **Local State**: `gameState`, `currentUser`, `pendingAction`
- **Derived State**: `charactersWithStatus`, `selectedCharacter`
- **Event Handlers**: Defined in page component, passed to children
- **WebSocket**: Managed at page level

## Future Enhancements

Consider these improvements:
1. Create barrel export file for lobby components (`lobby/index.ts`)
2. Extract WebSocket logic to custom hooks (`useGameLobby`, `useHostLobby`)
3. Add unit tests for shared components
4. Create Storybook stories for visual documentation
5. Consider Context API for deeply nested props
6. Add animation/transition effects for state changes

