# Clue-Less Game Rules Implementation Review
**Date:** November 7, 2025  
**Scope:** Server and Client code review against documented game requirements

## Executive Summary

This document reviews the current implementation of the Clue-Less game against the specified game rules focusing on:
1. Board layout and starting positions
2. Hallway occupancy enforcement
3. Movement rules
4. Suggestion and accusation mechanics
5. Turn-based gameplay

---

## ✅ Implemented Game Rules

### 1. Board Structure ✅
**Requirement:** 3×3 grid of rooms connected by 12 hallways

**Server Implementation:**
- `Board.java` defines canonical hallway IDs with proper naming convention
- 9 rooms: STUDY, HALL, LOUNGE, LIBRARY, BILLIARD, DINING, CONSERVATORY, BALLROOM, KITCHEN
- 11 hallways defined with canonical IDs (e.g., `HALL_LOUNGE_V`, `STUDY_LIBRARY_H`)
- 2 secret passages: LOUNGE↔CONSERVATORY, STUDY↔KITCHEN

**Client Implementation:**
- `Board.tsx` renders 3×3 grid layout
- `gameLogic.ts` defines room connections and hallway logic
- Visual representation matches game board specification

**Status:** ✅ IMPLEMENTED

### 2. Starting Positions ✅
**Requirement:** Each character starts in a specific hallway, not rooms

**Server Implementation:**
- `Board.STARTING_HALLWAYS` map defines canonical starting positions:
  - SCARLET → `HALL_LOUNGE_V` (vertical hallway below Hall)
  - MUSTARD → `LOUNGE_DINING_H` (horizontal hallway)
  - WHITE → `BALLROOM_KITCHEN_V` (vertical hallway above Kitchen)
  - GREEN → `CONSERVATORY_BALLROOM_V` (vertical hallway above Conservatory)
  - PEACOCK → `LIBRARY_CONSERVATORY_H` (horizontal hallway)
  - PLUM → `STUDY_LIBRARY_H` (horizontal hallway)
- `GameEngine.startGame()` places players in starting hallways
- Hallway occupancy tracked via `Hallway.occupy(Player)`

**Client Implementation:**
- Needs update to reflect hallway starting positions
- Currently shows players in rooms only

**Status:** ✅ SERVER IMPLEMENTED, ⚠️ CLIENT NEEDS UPDATE

### 3. Hallway Occupancy Rules ✅
**Requirement:** Each hallway holds max 1 character, occupied hallways block movement

**Server Implementation:**
- `Hallway` class has single occupant field
- `Hallway.isOccupied()` and `Hallway.getOccupant()` methods
- `Hallway.occupy(Player)` and `Hallway.vacate()` enforce single occupancy
- `RuleValidator.canMoveToHallway()` checks if hallway is unoccupied
- `MoveHandler.handleMove()` rejects moves to occupied hallways

**Client Implementation:**
- `gameLogic.ts` filters occupied hallways in `getValidMoves()`
- Client-side validation prevents selecting occupied hallways

**Status:** ✅ FULLY IMPLEMENTED

### 4. Movement Rules ✅
**Requirement:** No dice, choice-based movement with specific rules for rooms vs hallways

**Server Implementation:**
- **From Room:** Can move to adjacent hallway (if unoccupied), take secret passage, or stay (if moved by suggestion)
- **From Hallway:** MUST move to one of two adjacent rooms
- `RuleValidator.canMoveFromRoom()` enforces room exit rules
- `RuleValidator.canMoveFromHallway()` enforces hallway exit rules
- `MoveHandler` has separate methods:
  - `handleMove()` - room-to-room or hallway-to-room
  - `handleMoveToHallway()` - room-to-hallway
  - `handleMoveFromHallwayToRoom()` - hallway-to-room
- Secret passages allow direct room-to-room movement

**Client Implementation:**
- `gameLogic.ts` defines movement types: MOVE, MOVE_TO_HALLWAY, MOVE_FROM_HALLWAY
- `ROOM_CONNECTIONS` includes secret passages
- `getValidMoves()` filters based on current location and occupancy

**Status:** ✅ FULLY IMPLEMENTED

### 5. Suggestion Rules ✅
**Requirement:** Suggestions specify character + weapon; room is implicit; suggested suspect moves to room

**Server Implementation:**
- `SuggestionHandler.handleSuggestion()` validates player is in room
- Room is automatically set to player's current room
- `movePlayerToRoom()` moves suggested suspect's token
- `setMovedBySuggestionThisTurn(true)` tracks suggestion-based movement
- Disproof logic rotates through players in turn order

**Client Implementation:**
- Client needs to send only suspect and weapon
- Room automatically filled from player position

**Status:** ✅ SERVER IMPLEMENTED, ⚠️ CLIENT MAY NEED UPDATE

### 6. Blocked Exits / Trapped Detection ✅
**Requirement:** If all hallway exits are occupied and no secret passage available, player cannot suggest (but can accuse)

**Server Implementation:**
- `RuleValidator.isTrappedInRoom()` checks if all exits are blocked
- `RuleValidator.canMakeSuggestion()` enforces trap detection
- Exception: Players moved by suggestion can always suggest
- `GameEngine.handleSuggestion()` uses `canMakeSuggestion()` validation

**Client Implementation:**
- Not yet implemented in client-side validation
- Server will enforce this rule

**Status:** ✅ SERVER IMPLEMENTED, ⚠️ CLIENT NEEDS AWARENESS

### 7. Turn Management ✅
**Requirement:** Players must move if in hallway; players in rooms can choose actions

**Server Implementation:**
- `Player.movedBySuggestionThisTurn` flag tracks suggestion-based movement
- `Player.resetTurnFlags()` clears flags at turn start
- `GameState.nextTurn()` advances to next active player
- `GameEngine.advanceTurn()` resets turn flags

**Status:** ✅ IMPLEMENTED

### 8. Accusation Rules ✅
**Requirement:** Incorrect accusation eliminates player from sleuthing but keeps them for disproving

**Server Implementation:**
- `GameEngine.handleAccusation()` validates against solution
- Correct accusation → player wins, game ends
- Incorrect accusation → `player.deactivate()`, player stays for disproving
- If only 1 active player remains → that player wins

**Status:** ✅ IMPLEMENTED

---

## ⚠️ Discrepancies and Issues

### Issue 1: Board Hallway Count Discrepancy
**Problem:** Requirements state 12 hallways, implementation has 11 defined hallways

**Analysis:**
- Standard Clue board has 12 orthogonal hallways connecting the 3×3 room grid
- Current implementation defines 11 hallways in `Board.initStandard()`
- Missing hallways may need to be added based on actual game board layout

**Recommendation:** Verify against official Clue board diagram and add missing hallway

### Issue 2: Client-Server Location Synchronization
**Problem:** Server tracks hallways, but client primarily shows room-based positions

**Server State:**
- Players have `BoardLocation currentLocation` (can be Room or Hallway)
- Players have `Room currentRoom` (null when in hallway)

**Client State:**
- `PlayerView.room` (string, room name or null)
- `PlayerView.location` (optional, has type and name)

**MessageRouter Serialization:**
```java
pm.put("room", p.getCurrentRoom() != null ? p.getCurrentRoom().getName() : null);
```

**Issue:** MessageRouter doesn't serialize hallway location when player is in hallway

**Recommendation:** Update `MessageRouter.buildSnapshot()` to include location details:
```java
if (p.getLocation() instanceof Board.Hallway) {
    Map<String, Object> loc = new LinkedHashMap<>();
    loc.put("type", "HALLWAY");
    loc.put("name", ((Board.Hallway) p.getLocation()).getId());
    pm.put("location", loc);
} else if (p.getCurrentRoom() != null) {
    Map<String, Object> loc = new LinkedHashMap<>();
    loc.put("type", "ROOM");
    loc.put("name", p.getCurrentRoom().getName());
    pm.put("location", loc);
}
```

### Issue 3: Room Name Mismatches
**Problem:** Client uses different room names than server

**Server:** BILLIARD, DINING  
**Client:** BILLIARD_ROOM, DINING_ROOM

**Impact:** Client-server communication may fail for these rooms

**Recommendation:** Standardize room names across client and server

### Issue 4: Secret Passage Connectivity
**Problem:** Server defines 2 secret passages, requirements mention 4 secret passageways

**Requirements:** "twelve passageways, and four secret passageways"
- Interpretation: 12 regular hallways + 4 corner secret passages

**Current Implementation:**
- 2 secret passages: LOUNGE↔CONSERVATORY, STUDY↔KITCHEN
- These connect diagonally opposite corners

**Clarification Needed:** Are there 4 one-way passages (2 bidirectional) or 4 separate passages?

**Recommendation:** Verify against game requirements. Standard Clue has 2 bidirectional secret passages.

### Issue 5: Weapon Tracking
**Problem:** Requirements state "The system shall maintain and display the positions of all six weapons" but weapon positions not fully tracked

**Current Implementation:**
- `GameState` has `List<Weapon> weapons` but it's unused
- Weapons are cards in solution or player hands
- No physical weapon tokens on board

**Recommendation:** Determine if weapon tokens need physical board presence or if card-based is sufficient

### Issue 6: Movement Validation Complexity
**Problem:** Multiple movement APIs may cause confusion

**Current APIs:**
- `handleMove(player, targetRoom)` - legacy API, supports both hallway and room movements
- `handleMoveToHallway(player, hallwayId)` - explicit hallway entry
- `handleMoveFromHallwayToRoom(player, targetRoom)` - explicit hallway exit

**Recommendation:** Clarify which API clients should use:
- Option A: Keep legacy `handleMove()` for backward compatibility
- Option B: Deprecate legacy API, require explicit hallway moves
- Option C: Auto-detect movement type in `handleMove()`

---

## 🔧 Recommended Fixes

### Priority 1: Critical

1. **Update MessageRouter to serialize hallway locations**
   - File: `MessageRouter.java`
   - Add location serialization to `buildSnapshot()`

2. **Standardize room names between client and server**
   - Change server: BILLIARD → BILLIARD_ROOM, DINING → DINING_ROOM
   - OR change client to match server names

3. **Add missing 12th hallway**
   - Review 3×3 grid layout
   - Add missing hallway connection

### Priority 2: Important

4. **Update client Board component to show hallway positions**
   - Render hallways between rooms in grid
   - Show player tokens in hallways
   - Add visual indication of blocked hallways

5. **Implement client-side trapped detection**
   - Disable suggestion button when trapped
   - Show message to user

6. **Add movement type detection**
   - Client should determine if move goes through hallway
   - Send appropriate move message type

### Priority 3: Nice to Have

7. **Add weapon token tracking**
   - If required by game rules
   - Track weapon positions on board

8. **Improve API consistency**
   - Consolidate movement APIs
   - Clear documentation for each

9. **Add visual feedback for starting positions**
   - Show character names at starting hallways before game starts
   - Animate initial placement

---

## 📋 Testing Recommendations

### Server-Side Tests Needed:

1. **Starting Position Tests**
   - Verify each character spawns in correct hallway
   - Verify hallways are occupied after game start
   - Verify no two characters share a hallway

2. **Hallway Occupancy Tests**
   - Test single occupancy enforcement
   - Test blocked movement to occupied hallway
   - Test hallway vacation when player moves

3. **Movement Rule Tests**
   - Test room→hallway movement (valid and blocked)
   - Test hallway→room movement (must move)
   - Test hallway→hallway movement (should be rejected)
   - Test secret passage movement

4. **Trapped Room Tests**
   - Create scenario with all exits blocked
   - Verify suggestion is disabled
   - Verify accusation is still allowed
   - Verify exception for moved-by-suggestion

5. **Suggestion Movement Tests**
   - Verify suspect moves to room
   - Verify movedBySuggestionThisTurn flag is set
   - Verify flag allows immediate suggestion
   - Verify flag resets on turn end

### Integration Tests Needed:

1. **Full Game Flow**
   - Start game with 3 players
   - Verify starting positions
   - Move through hallways
   - Make suggestions with character movement
   - Test trapped scenarios
   - Make correct accusation

---

## 📊 Compliance Matrix

| Requirement | Server | Client | Status |
|-------------|--------|--------|--------|
| 3×3 room grid | ✅ | ✅ | COMPLIANT |
| 12 hallways | ⚠️ (11) | ⚠️ | PARTIAL |
| 4 secret passages | ⚠️ (2) | ⚠️ | NEEDS CLARIFICATION |
| Starting positions | ✅ | ❌ | SERVER ONLY |
| Hallway occupancy | ✅ | ✅ | COMPLIANT |
| Room movement | ✅ | ✅ | COMPLIANT |
| Hallway movement | ✅ | ⚠️ | PARTIAL |
| Secret passages | ✅ | ✅ | COMPLIANT |
| Suggestions | ✅ | ⚠️ | PARTIAL |
| Suggestion movement | ✅ | ❌ | SERVER ONLY |
| Trapped detection | ✅ | ❌ | SERVER ONLY |
| Turn management | ✅ | ⚠️ | PARTIAL |
| Accusations | ✅ | ✅ | COMPLIANT |

**Legend:**
- ✅ Fully Implemented
- ⚠️ Partially Implemented / Needs Review
- ❌ Not Implemented
- 🔄 In Progress

---

## 🎯 Next Steps

1. Fix MessageRouter location serialization (30 min)
2. Update client Board component for hallways (2-3 hours)
3. Resolve room name mismatches (30 min)
4. Verify hallway count and add missing connections (1 hour)
5. Add comprehensive test suite (4-6 hours)
6. Update client game logic for hallway movements (2 hours)
7. Add visual indicators for trapped states (1 hour)
8. Documentation updates (1 hour)

**Total Estimated Effort:** 12-15 hours

---

## 📝 Code Quality Notes

### Strengths:
- Clean separation of concerns (Board, GameEngine, RuleValidator)
- Comprehensive validation logic
- Good use of flags to track turn state
- Hallway occupancy properly enforced

### Areas for Improvement:
- Client-server synchronization needs work
- Some duplication between legacy and new APIs
- Missing comprehensive test coverage
- Documentation could be more detailed
- Room name consistency issues

---

## Conclusion

The server-side implementation of core game rules is **strong and mostly compliant** with requirements. The primary gaps are:
1. Client-server synchronization for hallway positions
2. Client UI updates to show hallway states  
3. Minor discrepancies in hallway/passage counts
4. Room naming inconsistencies

The foundation is solid, and the identified issues are addressable with focused development effort.
