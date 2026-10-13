package com.example.eda.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing idempotency for event consumers.
 * Demonstrates Requirement 3.b: Guaranteeing that duplicate events
 * do not cause duplicate side effects.
 */
@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);

    // Thread-safe set of processed event IDs
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();
    
    // Audit map of when each eventId was processed
    private final Map<String, Instant> processedTimestamps = new ConcurrentHashMap<>();

    /**
     * Atomically checks if an event has already been processed and marks it if not.
     * 
     * @param eventId the unique event identifier
     * @return true if the event was newly marked (first time seeing it);
     *         false if it was already processed (duplicate detected).
     */
    public boolean processIfAbsent(String eventId) {
        boolean isNew = processedEventIds.add(eventId);
        if (isNew) {
            processedTimestamps.put(eventId, Instant.now());
            log.debug("[IdempotencyService] Registered new eventId: {}", eventId);
        } else {
            log.warn("[IdempotencyService] DUPLICATE DETECTED for eventId: {}. Originally processed at: {}",
                    eventId, processedTimestamps.get(eventId));
        }
        return isNew;
    }

    public boolean isProcessed(String eventId) {
        return processedEventIds.contains(eventId);
    }

    public int getProcessedCount() {
        return processedEventIds.size();
    }
}
