/**
 * Game logic utilities for Clue-Less
 */

// Room connections (adjacencies) for the 5x5 grid
const ROOM_CONNECTIONS: Record<string, string[]> = {
  'STUDY': ['STUDY_HALL', 'STUDY_LIBRARY', 'KITCHEN'], // last is secret passage
  'HALL': ['STUDY_HALL', 'HALL_LOUNGE', 'HALL_BILLIARD'],
  'LOUNGE': ['HALL_LOUNGE', 'LOUNGE_DINING', 'CONSERVATORY'], // last is secret passage
  'LIBRARY': ['STUDY_LIBRARY', 'LIBRARY_BILLIARD', 'LIBRARY_CONSERVATORY'],
  'BILLIARD': ['HALL_BILLIARD', 'LIBRARY_BILLIARD', 'BILLIARD_DINING', 'BILLIARD_BALLROOM'],
  'DINING': ['LOUNGE_DINING', 'BILLIARD_DINING', 'DINING_KITCHEN'],
  'CONSERVATORY': ['LIBRARY_CONSERVATORY', 'CONSERVATORY_BALLROOM', 'LOUNGE'], // last is secret passage
  'BALLROOM': ['CONSERVATORY_BALLROOM', 'BILLIARD_BALLROOM', 'BALLROOM_KITCHEN'],
  'KITCHEN': ['DINING_KITCHEN', 'BALLROOM_KITCHEN', 'STUDY'], // last is secret passage
  
  // Hallways connect to two rooms
  'STUDY_HALL': ['STUDY', 'HALL'],
  'HALL_LOUNGE': ['HALL', 'LOUNGE'],
  'STUDY_LIBRARY': ['STUDY', 'LIBRARY'],
  'HALL_BILLIARD': ['HALL', 'BILLIARD'],
  'LOUNGE_DINING': ['LOUNGE', 'DINING'],
  'LIBRARY_BILLIARD': ['LIBRARY', 'BILLIARD'],
  'BILLIARD_DINING': ['BILLIARD', 'DINING'],
  'LIBRARY_CONSERVATORY': ['LIBRARY', 'CONSERVATORY'],
  'BILLIARD_BALLROOM': ['BILLIARD', 'BALLROOM'],
  'DINING_KITCHEN': ['DINING', 'KITCHEN'],
  'CONSERVATORY_BALLROOM': ['CONSERVATORY', 'BALLROOM'],
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
