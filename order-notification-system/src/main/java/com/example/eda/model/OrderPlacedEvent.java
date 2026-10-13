package com.example.eda.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;
import java.util.UUID;

/**
 * Event Schema for OrderPlaced satisfying Requirement 1.a:
 * - Event ID
 * - Event Type
 * - Timestamp
 * - Payload
 */
public record OrderPlacedEvent(
    String eventId,
    String eventType,
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    Instant timestamp,
    OrderPayload payload
) {
    public static OrderPlacedEvent create(OrderPayload payload) {
        return new OrderPlacedEvent(
            UUID.randomUUID().toString(),
            "OrderPlaced",
            Instant.now(),
            payload
        );
    }
}
