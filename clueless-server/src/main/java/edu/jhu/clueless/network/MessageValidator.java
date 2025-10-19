package edu.jhu.clueless.network;

import edu.jhu.clueless.network.dto.ClientMessage;

public class MessageValidator {

    // Throws IllegalArgumentException if invalid; no-op if valid.
    public void validate(ClientMessage msg) {
        if (msg == null) {
            throw new IllegalArgumentException("Null message");
        }
        if (msg.getType() == null) {
            throw new IllegalArgumentException("Missing type");
        }
        // Optional: enable when you standardize fields
        // if (msg.getCorrelationId() == null || msg.getCorrelationId().isBlank()) {
        //     throw new IllegalArgumentException("Missing correlationId");
        // }
        // Add per-type checks here...
    }
}