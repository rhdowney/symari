// Game logic utilities for Clue-Less
import type { PlayerToken } from '../types/game';

export interface Location {
  id: string;
  type: 'ROOM' | 'HALLWAY';
  name: string;
  connects?: string[];
  hasSecretPassage?: boolean;
  secretPassageTo?: string;
}

export const ROOMS = {
  STUDY: { id: 'STUDY', type: 'ROOM' as const, name: 'Study', hasSecretPassage: true, secretPassageTo: 'KITCHEN' },
  HALL: { id: 'HALL', type: 'ROOM' as const, name: 'Hall', hasSecretPassage: false },
  LOUNGE: { id: 'LOUNGE', type: 'ROOM' as const, name: 'Lounge', hasSecretPassage: true, secretPassageTo: 'CONSERVATORY' },
  LIBRARY: { id: 'LIBRARY', type: 'ROOM' as const, name: 'Library', hasSecretPassage: false },
  BILLIARD_ROOM: { id: 'BILLIARD_ROOM', type: 'ROOM' as const, name: 'Billiard Room', hasSecretPassage: false },
  DINING_ROOM: { id: 'DINING_ROOM', type: 'ROOM' as const, name: 'Dining Room', hasSecretPassage: false },
  CONSERVATORY: { id: 'CONSERVATORY', type: 'ROOM' as const, name: 'Conservatory', hasSecretPassage: true, secretPassageTo: 'LOUNGE' },
  BALLROOM: { id: 'BALLROOM', type: 'ROOM' as const, name: 'Ballroom', hasSecretPassage: false },
  KITCHEN: { id: 'KITCHEN', type: 'ROOM' as const, name: 'Kitchen', hasSecretPassage: true, secretPassageTo: 'STUDY' }
};

export const HALLWAYS = {
  STUDY_HALL: { id: 'STUDY_HALL', type: 'HALLWAY' as const, name: 'Study-Hall Hallway', connects: ['STUDY', 'HALL'] },
  HALL_LOUNGE: { id: 'HALL_LOUNGE', type: 'HALLWAY' as const, name: 'Hall-Lounge Hallway', connects: ['HALL', 'LOUNGE'] },
  STUDY_LIBRARY: { id: 'STUDY_LIBRARY', type: 'HALLWAY' as const, name: 'Study-Library Hallway', connects: ['STUDY', 'LIBRARY'] },
  HALL_BILLIARD: { id: 'HALL_BILLIARD', type: 'HALLWAY' as const, name: 'Hall-Billiard Hallway', connects: ['HALL', 'BILLIARD_ROOM'] },
  LOUNGE_DINING: { id: 'LOUNGE_DINING', type: 'HALLWAY' as const, name: 'Lounge-Dining Hallway', connects: ['LOUNGE', 'DINING_ROOM'] },
  LIBRARY_BILLIARD: { id: 'LIBRARY_BILLIARD', type: 'HALLWAY' as const, name: 'Library-Billiard Hallway', connects: ['LIBRARY', 'BILLIARD_ROOM'] },
  BILLIARD_DINING: { id: 'BILLIARD_DINING', type: 'HALLWAY' as const, name: 'Billiard-Dining Hallway', connects: ['BILLIARD_ROOM', 'DINING_ROOM'] },
  LIBRARY_CONSERVATORY: { id: 'LIBRARY_CONSERVATORY', type: 'HALLWAY' as const, name: 'Library-Conservatory Hallway', connects: ['LIBRARY', 'CONSERVATORY'] },
  BILLIARD_BALLROOM: { id: 'BILLIARD_BALLROOM', type: 'HALLWAY' as const, name: 'Billiard-Ballroom Hallway', connects: ['BILLIARD_ROOM', 'BALLROOM'] },
  DINING_KITCHEN: { id: 'DINING_KITCHEN', type: 'HALLWAY' as const, name: 'Dining-Kitchen Hallway', connects: ['DINING_ROOM', 'KITCHEN'] },
  CONSERVATORY_BALLROOM: { id: 'CONSERVATORY_BALLROOM', type: 'HALLWAY' as const, name: 'Conservatory-Ballroom Hallway', connects: ['CONSERVATORY', 'BALLROOM'] },
  BALLROOM_KITCHEN: { id: 'BALLROOM_KITCHEN', type: 'HALLWAY' as const, name: 'Ballroom-Kitchen Hallway', connects: ['BALLROOM', 'KITCHEN'] }
};

export const ALL_LOCATIONS = { ...ROOMS, ...HALLWAYS };

// Game logic functions
export function isHallwayBlocked(hallwayId: string, playerTokens: PlayerToken[]): boolean {
  return playerTokens.some(token => token.locationId === hallwayId);
}

export function getValidMoves(currentLocation: string, playerTokens: PlayerToken[], wasMoved: boolean = false): string[] {
  const location = ALL_LOCATIONS[currentLocation as keyof typeof ALL_LOCATIONS];
  if (!location) return [];

  const validMoves: string[] = [];

  if (location.type === 'ROOM') {
    // From a room, you can:
    // 1. Move to adjacent hallways (if not blocked)
    // 2. Use secret passage (if available)
    // 3. Stay in room if you were moved there by a suggestion

    // Find adjacent hallways
    Object.values(HALLWAYS).forEach(hallway => {
      if (hallway.connects?.includes(currentLocation) && !isHallwayBlocked(hallway.id, playerTokens)) {
        validMoves.push(hallway.id);
      }
    });

    // Secret passage
    if (location.hasSecretPassage && 'secretPassageTo' in location && location.secretPassageTo) {
      validMoves.push(location.secretPassageTo);
    }

    // If moved by suggestion, can stay in current room
    if (wasMoved) {
      validMoves.push(currentLocation);
    }
  } else if (location.type === 'HALLWAY') {
    // From a hallway, you MUST move to one of the connected rooms
    if (location.connects) {
      validMoves.push(...location.connects);
    }
  }

  return validMoves;
}

export function canMakeSuggestion(currentLocation: string, validMoves: string[], wasMoved: boolean = false): boolean {
  const location = ALL_LOCATIONS[currentLocation as keyof typeof ALL_LOCATIONS];
  if (!location) return false;

  if (location.type === 'ROOM') {
    // Can make suggestion if:
    // 1. You're in a room AND have valid moves OR
    // 2. You were moved to the room by another player's suggestion OR
    // 3. You used a secret passage to get here
    return validMoves.length > 0 || wasMoved;
  } else if (location.type === 'HALLWAY') {
    // From hallway, you must move to a room and then can make suggestion
    return false;
  }

  return false;
}

export function canMakeAccusation(): boolean {
  // You can always make an accusation during your turn
  return true;
}

// Character starting positions (hallways)
export const STARTING_POSITIONS = {
  SCARLET: 'HALL_LOUNGE',
  MUSTARD: 'LOUNGE_DINING',
  WHITE: 'BALLROOM_KITCHEN',
  GREEN: 'CONSERVATORY_BALLROOM',
  PEACOCK: 'LIBRARY_CONSERVATORY',
  PLUM: 'STUDY_LIBRARY'
};