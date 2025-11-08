/**
 * Game logic utilities for Clue-Less
 */

// Room connections (adjacencies) for the 5x5 grid
// Hallway IDs use server's canonical format (alphabetically sorted)
const ROOM_CONNECTIONS: Record<string, string[]> = {
  'STUDY': ['HALL_STUDY', 'LIBRARY_STUDY', 'KITCHEN'], // last is secret passage
  'HALL': ['HALL_STUDY', 'HALL_LOUNGE', 'BILLIARD_HALL'],
  'LOUNGE': ['HALL_LOUNGE', 'DINING_LOUNGE', 'CONSERVATORY'], // last is secret passage
  'LIBRARY': ['LIBRARY_STUDY', 'BILLIARD_LIBRARY', 'CONSERVATORY_LIBRARY'],
  'BILLIARD': ['BILLIARD_HALL', 'BILLIARD_LIBRARY', 'BILLIARD_DINING', 'BALLROOM_BILLIARD'],
  'DINING': ['DINING_LOUNGE', 'BILLIARD_DINING', 'DINING_KITCHEN'],
  'CONSERVATORY': ['CONSERVATORY_LIBRARY', 'BALLROOM_CONSERVATORY', 'LOUNGE'], // last is secret passage
  'BALLROOM': ['BALLROOM_CONSERVATORY', 'BALLROOM_BILLIARD', 'BALLROOM_KITCHEN'],
  'KITCHEN': ['DINING_KITCHEN', 'BALLROOM_KITCHEN', 'STUDY'], // last is secret passage
  
  // Hallways connect to two rooms (using canonical alphabetical format)
  'HALL_STUDY': ['STUDY', 'HALL'],
  'HALL_LOUNGE': ['HALL', 'LOUNGE'],
  'LIBRARY_STUDY': ['STUDY', 'LIBRARY'],
  'BILLIARD_HALL': ['HALL', 'BILLIARD'],
  'DINING_LOUNGE': ['LOUNGE', 'DINING'],
  'BILLIARD_LIBRARY': ['LIBRARY', 'BILLIARD'],
  'BILLIARD_DINING': ['BILLIARD', 'DINING'],
  'CONSERVATORY_LIBRARY': ['LIBRARY', 'CONSERVATORY'],
  'BALLROOM_BILLIARD': ['BILLIARD', 'BALLROOM'],
  'DINING_KITCHEN': ['DINING', 'KITCHEN'],
  'BALLROOM_CONSERVATORY': ['CONSERVATORY', 'BALLROOM'],
  'BALLROOM_KITCHEN': ['BALLROOM', 'KITCHEN'],
};

// Rooms where suggestions can be made
const ROOMS = [
  'STUDY', 'HALL', 'LOUNGE', 'LIBRARY', 'BILLIARD',
  'DINING', 'CONSERVATORY', 'BALLROOM', 'KITCHEN'
];

interface PlayerToken {
  playerId: string;
  locationId: string;
}

/**
 * Get valid moves from a location
 */
export function getValidMoves(currentLocation: string, playerTokens: PlayerToken[]): string[] {
  const connections = ROOM_CONNECTIONS[currentLocation] || [];
  
  // Filter out occupied hallways (only one player allowed in hallways)
  return connections.filter(loc => {
    // Rooms can have multiple players
    if (ROOMS.includes(loc)) return true;
    
    // Hallways can only have one player
    const isOccupied = playerTokens.some(token => token.locationId === loc);
    return !isOccupied;
  });
}

/**
 * Check if player can make a suggestion (must be in a room)
 */
export function canMakeSuggestion(currentLocation: string): boolean {
  // Player must be in a room (not a hallway) to make a suggestion
  return ROOMS.includes(currentLocation);
}

/**
 * Check if player can make an accusation (can do anytime on their turn)
 */
export function canMakeAccusation(): boolean {
  // In standard Clue-Less, accusations can be made any time on player's turn
  return true;
}

/**
 * Check if a location is a room
 */
export function isRoom(location: string): boolean {
  return ROOMS.includes(location);
}

/**
 * Check if a location is a hallway
 */
export function isHallway(location: string): boolean {
  return location.includes('_') && !ROOMS.includes(location);
}

/**
 * Determine the type of move based on current and target locations
 * Returns: 'MOVE' (room to room), 'MOVE_TO_HALLWAY' (room to hallway), or 'MOVE_FROM_HALLWAY' (hallway to room)
 */
export function getMoveType(currentLocation: string, targetLocation: string): 'MOVE' | 'MOVE_TO_HALLWAY' | 'MOVE_FROM_HALLWAY' {
  const currentIsRoom = isRoom(currentLocation);
  const currentIsHallway = isHallway(currentLocation);
  const targetIsRoom = isRoom(targetLocation);
  const targetIsHallway = isHallway(targetLocation);
  
  // Moving from hallway to room
  if (currentIsHallway && targetIsRoom) {
    return 'MOVE_FROM_HALLWAY';
  }
  
  // Moving from room to hallway
  if (currentIsRoom && targetIsHallway) {
    return 'MOVE_TO_HALLWAY';
  }
  
  // Moving from room to room (direct adjacency or secret passage)
  return 'MOVE';
}
