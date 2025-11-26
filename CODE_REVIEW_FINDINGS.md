# Comprehensive Code Review - Game Rules Compliance

**Date:** November 26, 2025  
**Reviewer:** AI Code Review  
**Focus:** Game Rules > Teammate Recommendations

---

## 🚨 **CRITICAL GAME RULE VIOLATIONS** (Must Fix)

### ❌ **VIOLATION #1: Suspects Limited to Players Only**
**Teammate Feedback:** "Suspects who aren't assigned to players still need to be in the game, available for Suggestions and Accusations."

**Status:** ❌ **CONFIRMED VIOLATION**

**Evidence:**
```typescript
// clueless-client/src/pages/GameBoardPage.tsx:102-105
const activeSuspects = useMemo(() => {
  if (!gameState) return [];
  return gameState.players.map(p => p.character).filter(Boolean);
}, [gameState]);
```

**Problem:**
- Only player-assigned characters available for suggestions/accusations
- With 3 players: only 3 suspects available (should be all 6)
- Violates core Clue rule: all 6 suspects must exist independently

**Game Rule Impact:** HIGH - Players cannot suggest/accuse unassigned suspects

**Fix Required:**
- Server: Create independent `Suspect` entities (all 6)
- Client: Change `activeSuspects` to constant array of all 6 characters
- Update modals to show all 6 suspects regardless of player count

**Files to Fix:**
- Client: `GameBoardPage.tsx`, `SuggestionModal.tsx`, `AccusationModal.tsx`
- Server: `GameState.java`, `SuggestionHandler.java` (track all 6 suspect positions)

---

### ❌ **VIOLATION #2: No "Must Move Out" Rule Enforcement**
**Teammate Feedback:** "A player in a room should be required to move out of the room, unless their character was moved into the room as part of a Suggestion."

**Status:** ❌ **CONFIRMED VIOLATION**

**Evidence:**
```java
// Player.java:12-13
private boolean movedThisTurn;
private boolean suggestedThisTurn;
// ❌ MISSING: private boolean movedBySuggestionThisTurn;
// ❌ MISSING: private boolean mustMoveNextTurn;
```

**Problem:**
- No tracking of HOW player entered room (self-moved vs suggestion-moved)
- Cannot enforce: "if you move yourself into room, must move out next turn"
- Cannot exempt: "if moved by suggestion, may stay"

**Game Rule Impact:** HIGH - Players can camp in rooms indefinitely

**Fix Required:**
```java
// Add to Player.java
private boolean movedBySuggestionThisTurn;
private boolean mustMoveNextTurn;

// SuggestionHandler.java - mark when moving player
private void movePlayerToRoom(Player p, Room targetRoom) {
    // ... existing code ...
    p.setMovedBySuggestionThisTurn(true);  // ADD THIS
}

// MessageRouter.java - enforce rule
if (player in room && !movedBySuggestionThisTurn && !hasMovedThisTurn) {
    mustMoveNextTurn = true; // Player stayed, must move out next turn
}
```

**Files to Fix:**
- `Player.java` - add flags
- `SuggestionHandler.java` - set flag when moving player
- `MessageRouter.java` - enforce must-move validation

---

### ❌ **VIOLATION #3: Server Chooses Card to Show (Not Player)**
**Teammate Feedback:** "Players should get to decide which card to show when it's time to disprove, instead of the server deciding."

**Status:** ❌ **CONFIRMED VIOLATION**

**Evidence:**
```java
// SuggestionHandler.java:50-52
List<Card> matches = matchingCards(cand, suspect, weapon, room);
if (!matches.isEmpty()) {
    Card chosen = matches.get(0); // ❌ SERVER CHOOSES FIRST CARD
    disprover = cand.getName();
    revealedCard = chosen.getName();
}
```

```tsx
// DisproveModal.tsx:90-93
<div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3 mt-4">
  <p className="text-blue-200 text-sm">
    ℹ️ The server will automatically show one of these cards to {suggester}.
  </p>
</div>
```

**Problem:**
- Server automatically picks first matching card
- Strategic element removed - player should choose which card to reveal
- Standard Clue rules: player CHOOSES which card to show

**Game Rule Impact:** MEDIUM - Removes strategic gameplay element

**Fix Required:**
1. Server sends `DISPROVE_REQUEST` to player with matching cards
2. Player chooses card via `DisproveModal` and sends `DISPROVE_RESPONSE`
3. Server then reveals chosen card to suggester

**Flow Change:**
```
Current:
SUGGEST → Server finds disprover → Auto-picks card → ACK

Fixed:
SUGGEST → Server finds disprover → DISPROVE_REQUEST 
       → Player chooses → DISPROVE_RESPONSE 
       → Server sends ACK with chosen card
```

**Files to Fix:**
- `MessageRouter.java` - handle DISPROVE_RESPONSE
- `SuggestionHandler.java` - remove auto-selection, wait for player choice
- `DisproveModal.tsx` - add "Choose Card" buttons instead of info message

---

### ⚠️ **VIOLATION #4: Revealed Card Not Shown to Suggester**
**Teammate Feedback:** "The Suggestion was disproved by another player, but the player who made the Suggestion wasn't notified which card was shown."

**Status:** ⚠️ **PARTIAL BUG - ACK sent but client may not handle**

**Evidence:**
```java
// MessageRouter.java:258-264 - Server DOES send revealedCard
String ack = "{\"type\":\"ACK\",\"for\":\"SUGGEST\",...
    + "\",\"revealedCard\":\"" + (res.getRevealedCard() == null ? "" : esc(res.getRevealedCard()))
    + "\",\"state\":" + stateJson + "}";
send(out, ack);
```

**Problem:**
- Server correctly sends `revealedCard` in ACK
- Client may not be displaying it to suggester
- Need to verify client-side handling

**Investigation Needed:**
- Check `usePlayer.ts` - does it extract `revealedCard` from ACK?
- Check `GameBoardPage.tsx` - does it show revealed card in UI?
- Add toast/modal showing: "Player X showed you: [CARD]"

**Files to Check:**
- `usePlayer.ts` - ACK message handling
- `GameBoardPage.tsx` - display revealed card
- Consider: `ToastNotification.tsx` or new `RevealedCardModal.tsx`

---

### ❌ **VIOLATION #5: Game Stuck After 2nd False Accusation**
**Teammate Feedback:** "A second player made a false Accusation. After that, all 3 players were stuck 'waiting for other players'. Nobody could do anything."

**Status:** ❌ **CONFIRMED BUG - Turn not advancing after elimination**

**Evidence:**
```java
// GameEngine.java:104-117
if (correct) {
    gameState.setGameOver(true);
    gameState.setWinner(playerName);
    return new AccusationResult(true, true, playerName, false);
} else {
    p.deactivate(); // Player eliminated
    
    // ... check if only 1 active left ...
    
    if (isPlayersTurn(playerName)) gameState.nextTurn(); // ✅ Advances turn
    return new AccusationResult(false, false, null, true);
}
```

**Problem:**
- Code looks correct - it DOES call `nextTurn()` after false accusation
- But `advanceTurn()` resets flags of NEW current player
- Bug likely: eliminated player still in turn rotation OR nextTurn() fails to find active player

**Root Cause:**
```java
// GameState.java:39-51 - nextTurn() implementation
public Player nextTurn() {
    if (players.isEmpty()) { currentPlayer = null; return null; }
    List<Player> order = new ArrayList<>(players.values());
    // ... finds next active player ...
    for (int step = 1; step <= order.size(); step++) {
        Player cand = order.get((i + step) % order.size());
        if (cand != null && cand.isActive()) {  // ✅ Checks isActive
            currentPlayer = cand;
            return currentPlayer;
        }
    }
    // If none active, keep current as-is  ← ❌ PROBLEM: keeps eliminated player!
    return currentPlayer;
}
```

**Actual Bug:**
- If no active players found, it keeps eliminated player as current
- Should set `currentPlayer = null` and `gameOver = true`

**Fix Required:**
```java
// GameState.java:nextTurn()
for (int step = 1; step <= order.size(); step++) {
    Player cand = order.get((i + step) % order.size());
    if (cand != null && cand.isActive()) {
        currentPlayer = cand;
        return currentPlayer;
    }
}
// ❌ OLD: return currentPlayer;
// ✅ NEW:
currentPlayer = null;  // No active players left
return null;
```

```java
// GameEngine.java:handleAccusation() - add check
if (active == 0) {
    gameState.setGameOver(true);
    gameState.setWinner(null);  // No winner - all eliminated
    return new AccusationResult(false, true, null, true);
}
```

**Files to Fix:**
- `GameState.java` - fix nextTurn() to set null when no active
- `GameEngine.java` - handle active == 0 case

---

## ✅ **CONFIRMED: NOT VIOLATIONS**

### ✅ **Secret Passages ARE Implemented**
**Teammate Feedback:** "Secret passageways aren't implemented."

**Status:** ✅ **FALSE - Secret passages fully working**

**Evidence:**
```java
// Board.java:100-101
// Secret passages (diagonal corners)
secret(LOUNGE, CONSERVATORY);
secret(STUDY, KITCHEN);
```

```typescript
// gameLogic.ts:8-16
'STUDY': ['HALL_STUDY', 'LIBRARY_STUDY', 'KITCHEN'], // last is secret passage
'LOUNGE': ['HALL_LOUNGE', 'DINING_LOUNGE', 'CONSERVATORY'], // last is secret passage
'CONSERVATORY': [..., 'LOUNGE'], // secret passage
'KITCHEN': [..., 'STUDY'], // secret passage
```

```tsx
// Board.tsx:331-338
{/* Secret passage indicator */}
{hasSecretPassage(cellId) && (
  <div className="absolute bottom-1 right-1 text-xs">
    🔀
  </div>
)}
```

**Tests Pass:**
```java
// BoardTopologyTest.java:26-27
assertTrue(board.areAdjacent(study, kitchen)); // secret passage
assertTrue(board.areAdjacent(lounge, conservatory)); // secret passage
```

**Conclusion:** Secret passages work correctly. Teammate may have missed the tunnel icons (🔀) or not tested corner rooms.

---

### ⚠️ **Suggest Button Not Graying Out**
**Teammate Feedback:** "The Suggestion button wasn't grayed out after the Suggestion was disproved."

**Status:** ⚠️ **WORKING AS DESIGNED - But confusing UX**

**Evidence:**
```java
// MessageRouter.java:248
if (p.hasSuggestedThisTurn()) { 
    send(out, "{\"type\":\"ERROR\",\"message\":\"Already suggested this turn\"}"); 
    break; 
}
```

```typescript
// GameBoardPage.tsx:122
const canSuggest = currentLocation ? canMakeSuggestion(currentLocation) : false;
```

**Analysis:**
- Server correctly blocks multiple suggestions per turn
- `hasSuggestedThisTurn` flag set when suggestion accepted
- Button enabled/disabled based on `canSuggest` (room check only)
- **BUG:** Client doesn't track `hasSuggestedThisTurn` locally

**Fix Required:**
```typescript
// Add to GameBoardPage.tsx
const [hasSuggestedThisTurn, setHasSuggestedThisTurn] = useState(false);

// In handleSuggest success callback
setHasSuggestedThisTurn(true);

// Reset on turn change
useEffect(() => {
  if (gameState?.currentPlayer === playerId) {
    setHasSuggestedThisTurn(false);
  }
}, [gameState?.currentPlayer, playerId]);

// Update canSuggest
const canSuggest = currentLocation 
  ? canMakeSuggestion(currentLocation) && !hasSuggestedThisTurn
  : false;
```

---

## 🎨 **UI/GRAPHICS RECOMMENDATIONS** (Nice to Have)

### 📐 **Hallway Size**
**Feedback:** "Hallways should be smaller or at least narrower, relative to the room size."

**Status:** VALID - Quality of life improvement

**Current Implementation:**
```tsx
// Board.tsx - hallways and rooms same size (5.5rem each)
style={{ height: '5.5rem', width: '5.5rem' }}
```

**Recommendation:**
```tsx
// Rooms: 5.5rem × 5.5rem (keep current)
// Horizontal hallways: 5.5rem × 3rem (narrower)
// Vertical hallways: 3rem × 5.5rem (narrower)

const isHorizontalHallway = (row % 2 === 0 && col % 2 === 1);
const isVerticalHallway = (row % 2 === 1 && col % 2 === 0);

style={{
  height: isVerticalHallway ? '3rem' : '5.5rem',
  width: isHorizontalHallway ? '3rem' : '5.5rem'
}}
```

---

### 🎨 **Room Borders Always Visible**
**Feedback:** "Room borders/walls should be visible at all times."

**Status:** VALID - Clarity improvement

**Current Implementation:**
```tsx
// Board.tsx - borders only on hover or valid move
className={`${isValidMove ? 'ring-4 ring-green-500' : ''}`}
```

**Recommendation:**
```tsx
// Add permanent visible borders to rooms
className={`border-4 border-gray-800 ${roomSpecificBorder} ...`}

// Example per room:
'STUDY': 'border-amber-600'
'HALL': 'border-stone-600'
// etc.
```

---

### 📱 **Layout: Cards & Feed on Side**
**Feedback:** "The card list and event feed should be on the side of the board, not below, to use screen space better."

**Status:** VALID - Better screen usage

**Current Layout:**
```
┌─────────────────┐
│      Board      │
├─────────────────┤
│   Hand Panel    │
├─────────────────┤
│   Action Bar    │
└─────────────────┘
```

**Recommended Layout:**
```
┌──────────┬──────┐
│          │ Hand │
│  Board   │ Panel│
│          ├──────┤
│          │Events│
├──────────┴──────┤
│   Action Bar    │
└─────────────────┘
```

**Implementation:**
```tsx
// GameBoardPage.tsx
<div className="flex gap-4">
  <div className="flex-1">
    <Board ... />
  </div>
  <div className="w-80 flex flex-col gap-4">
    <HandPanel cards={...} />
    <EventFeed events={...} />
  </div>
</div>
<ActionBar ... />
```

---

### 🚪 **Quit/Disconnect Button**
**Feedback:** "There doesn't seem to be any way to quit the game and/or close the web connection."

**Status:** VALID - Missing feature

**Current State:** No quit button in UI

**Recommendation:**
```tsx
// Add to GameBoardPage.tsx header
<button 
  onClick={() => {
    send({ type: 'LEAVE_GAME', gameId, playerId });
    navigate('/lobby');
  }}
  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
>
  Leave Game
</button>
```

```java
// Add to MessageRouter.java
case LEAVE_GAME: {
    String gameId = msg.getGameId();
    String playerId = msg.getPlayerId();
    
    // Remove from joined set
    joined.getOrDefault(gameId, ConcurrentHashMap.newKeySet()).remove(playerId);
    
    // If was in-game, deactivate player
    GameEngine engine = engines.get(gameId);
    if (engine != null) {
        Player p = engine.getGameState().getPlayer(playerId);
        if (p != null) {
            p.deactivate();
            if (engine.isPlayersTurn(playerId)) {
                engine.advanceTurn();
            }
        }
    }
    
    broadcast(gameId, "{\"type\":\"EVENT\",\"event\":\"PLAYER_LEFT\",...}", out);
    break;
}
```

---

## 📋 **PRIORITY FIX RANKING**

### 🔴 **IMMEDIATE (Game Breaking)**
1. **Fix "stuck after 2 eliminations" bug** (1-2 hours)
   - `GameState.java:nextTurn()` - return null when no active
   - `GameEngine.java:handleAccusation()` - handle all-eliminated case
   
2. **Add all 6 suspects** (6-8 hours)
   - Server: Create `Suspect` entities
   - Client: Show all 6 in modals

3. **Add movement tracking** (3-4 hours)
   - `Player.java` - add movedBySuggestionThisTurn flag
   - Enforce "must move out" rule

### 🟡 **HIGH PRIORITY (Rule Violations)**
4. **Player chooses card to disprove** (4-5 hours)
   - Add DISPROVE_REQUEST/RESPONSE flow
   - Update `DisproveModal` with selection UI

5. **Fix suggest button not disabling** (1 hour)
   - Track `hasSuggestedThisTurn` on client

6. **Verify revealed card shown to suggester** (1-2 hours)
   - Check client ACK handling
   - Add UI to display revealed card

### 🟢 **MEDIUM (UX Improvements)**
7. **Hallway sizing** (1 hour)
8. **Room borders always visible** (30 min)
9. **Layout: side panel for cards/events** (2-3 hours)
10. **Add quit/leave button** (2 hours)

---

## 🎯 **TOTAL EFFORT ESTIMATE**

| Priority | Items | Hours |
|----------|-------|-------|
| 🔴 Critical | 3 | 10-14 |
| 🟡 High | 3 | 6-8 |
| 🟢 Medium | 4 | 5.5-6.5 |
| **TOTAL** | **10** | **21.5-28.5** |

---

## ✅ **RECOMMENDATION**

**Ship Order:**
1. Fix elimination bug (CRITICAL - 2h)
2. Add all 6 suspects (CRITICAL - 8h)
3. Add movement tracking (CRITICAL - 4h)
4. Player chooses disprove card (HIGH - 5h)
5. Everything else can be post-launch

**Minimum Viable Fix:** Items 1-3 (14 hours) = Game follows rules correctly
