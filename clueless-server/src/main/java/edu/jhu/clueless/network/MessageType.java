package edu.jhu.clueless.network;

public enum MessageType {
    PING, JOIN,
    MOVE, // room-to-room (atomic)
    MOVE_TO_HALLWAY, // step 1: room -> hallway
    MOVE_FROM_HALLWAY, // step 2: hallway -> room
    SUGGEST, DISPROVE_REQUEST, DISPROVE_RESPONSE, ACCUSE, END_TURN,
    NEW_GAME,
    // Lobby flow
    JOIN_LOBBY, SELECT_CHARACTER, UNSELECT_CHARACTER, SET_READY, START_GAME
}